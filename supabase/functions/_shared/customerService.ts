// AI 智慧客服:
//  - answerMemberQuestion:已綁定會員 → 本人資料 + FAQ + 門市資訊
//  - answerGeneralQuestion:未綁定訪客 → 只用 FAQ + 門市資訊(不含任何個資)
// 安全設計:LLM 不直接存取資料庫,只收到已過濾好的資料摘要。
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, ChatMessage } from "./ai.ts";
import { FAQ_KNOWLEDGE } from "./faq.ts";

const LEVEL_LABEL: Record<string, string> = {
  regular: "一般客戶",
  silver: "VIP 銀卡",
  gold: "VIP 金卡",
  black: "VIP 黑卡",
};

const SYSTEM_PROMPT_MEMBER = `你是「伯洸眼鏡」官方帳號的客服助理。請嚴格遵守:
1. 「會員資料」是當前這位會員本人的資料,只用來回答他本人的個人問題(等級、購物金、驗光、消費紀錄等),絕不可透露或臆測他人資料。
2. 一般性問題(例如為什麼眼鏡貴、鏡片差異、驗光流程等)請「以 FAQ 的答案為準」,盡量貼近 FAQ 原文的用語與精簡風格;控制在約 2–4 句,不要自行大幅擴充、不要新增 FAQ 未提及的內容、避免使用數字條列。
3. 若問題超出所提供的所有資料範圍,請禮貌說明你沒有該資訊並建議洽門市人員,切勿編造。
4. 一律以繁體中文回答,語氣親切、簡潔,適合手機閱讀,避免冗長。
5. 涉及金額、度數等數字時,一律使用資料中的實際數值,不可虛構。
6. 不要透露內部欄位名稱、系統或資料庫細節。`;

const SYSTEM_PROMPT_GENERAL = `你是「伯洸眼鏡」官方帳號的客服助理。目前這位訪客尚未綁定會員。請遵守:
1. 回答一般性問題(眼鏡、鏡片、驗光、價格觀念等)時,請「以 FAQ 的答案為準」,盡量貼近 FAQ 原文的用語與精簡風格;控制在約 2–4 句,不要自行大幅擴充、不要新增 FAQ 未提及的內容、避免使用數字條列。門市資訊類問題依「門市資訊」回答。
2. 若對方詢問個人會員資料(等級、購物金、驗光或消費紀錄),請說明需先綁定會員:輸入門市提供的 8 碼綁定碼即可,或洽門市人員。
3. 超出 FAQ 與門市資訊範圍者,請禮貌說明並建議洽門市人員,切勿編造。
4. 一律以繁體中文回答,語氣親切、簡潔,適合手機閱讀。`;

interface AnswerResult {
  content: string;
  tokens: number | null;
}

// ---------- 已綁定會員:本人資料 + FAQ ----------
export async function answerMemberQuestion(
  supabase: SupabaseClient,
  memberId: string,
  question: string,
): Promise<AnswerResult> {
  const { data: member } = await supabase
    .from("members")
    .select("name, level, shopping_credit, coupon_count, vip_amount, birthday")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return { content: "查無您的會員資料,請洽門市人員協助。", tokens: null };
  }

  const { data: rx } = await supabase
    .from("prescriptions")
    .select(
      "exam_date, service_type, examiner, amount, credit_used, " +
        "right_best_s, right_best_c, right_best_a, left_best_s, left_best_c, left_best_a, " +
        "right_pd, left_pd, right_add, left_add",
    )
    .eq("member_id", memberId)
    .order("exam_date", { ascending: false })
    .limit(5);

  const { data: tx } = await supabase
    .from("transactions")
    .select("transaction_date, total, payment_method")
    .eq("member_id", memberId)
    .order("transaction_date", { ascending: false })
    .limit(5);

  const store = await fetchStore(supabase);

  const creditUsed = (rx ?? []).reduce(
    (s: number, r: any) => s + Number(r.credit_used || 0),
    0,
  );
  const remaining = Number((member as any).shopping_credit || 0) - creditUsed;

  const context = buildMemberContext(member as any, rx ?? [], tx ?? [], store, remaining);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT_MEMBER}\n\n${context}\n\n【常見問題 FAQ】\n${FAQ_KNOWLEDGE}`,
    },
    { role: "user", content: question },
  ];

  const result = await callLovableAI(messages);
  return { content: result.content, tokens: result.tokens };
}

// ---------- 未綁定訪客:只用 FAQ + 門市資訊 ----------
export async function answerGeneralQuestion(
  supabase: SupabaseClient,
  question: string,
): Promise<AnswerResult> {
  const store = await fetchStore(supabase);
  const context = buildStoreContext(store);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT_GENERAL}\n\n${context}\n\n【常見問題 FAQ】\n${FAQ_KNOWLEDGE}`,
    },
    { role: "user", content: question },
  ];

  const result = await callLovableAI(messages);
  return { content: result.content, tokens: result.tokens };
}

// ---------- helpers ----------
async function fetchStore(
  supabase: SupabaseClient,
): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "store_info")
    .maybeSingle();
  return (data?.value ?? {}) as Record<string, unknown>;
}

function buildStoreContext(store: Record<string, unknown>): string {
  const lines: string[] = ["【門市資訊】"];
  if (store.name) lines.push(`店名:${store.name}`);
  if (store.phone) lines.push(`電話:${store.phone}`);
  if (store.address) lines.push(`地址:${store.address}`);
  return lines.join("\n");
}

function buildMemberContext(
  member: any,
  rx: any[],
  tx: any[],
  store: Record<string, unknown>,
  remaining: number,
): string {
  const lines: string[] = [];

  lines.push("【會員資料】");
  lines.push(`姓名:${member.name}`);
  lines.push(`會員等級:${LEVEL_LABEL[member.level] ?? member.level}`);
  lines.push(`購物金餘額:NT$${Math.round(remaining).toLocaleString("zh-TW")}`);
  lines.push(`購物券張數:${member.coupon_count ?? 0}`);
  if (Number(member.vip_amount || 0) > 0) {
    lines.push(`VIP 金額:NT$${Number(member.vip_amount).toLocaleString("zh-TW")}`);
  }
  if (member.birthday) lines.push(`生日:${member.birthday}`);

  if (rx.length) {
    lines.push("");
    lines.push("【近期驗光/服務紀錄】");
    for (const r of rx) lines.push(formatPrescription(r));
  }

  if (tx.length) {
    lines.push("");
    lines.push("【近期消費紀錄】");
    for (const t of tx) {
      const pay = { cash: "現金", card: "刷卡", transfer: "轉帳" }[
        t.payment_method as string
      ] ?? t.payment_method;
      lines.push(
        `- ${t.transaction_date} 消費 NT$${Number(t.total || 0).toLocaleString("zh-TW")}（${pay}）`,
      );
    }
  }

  lines.push("");
  lines.push(buildStoreContext(store));

  return lines.join("\n");
}

function formatPrescription(r: any): string {
  const parts: string[] = [`- ${r.exam_date}`];
  if (r.service_type) parts.push(String(r.service_type));
  if (r.examiner) parts.push(`驗光師:${r.examiner}`);

  const eye = (s: any, c: any, a: any) => {
    const seg: string[] = [];
    if (s !== null && s !== undefined) seg.push(`S${fmtNum(s)}`);
    if (c !== null && c !== undefined) seg.push(`C${fmtNum(c)}`);
    if (a !== null && a !== undefined) seg.push(`A${a}`);
    return seg.join(" ");
  };
  const right = eye(r.right_best_s, r.right_best_c, r.right_best_a);
  const left = eye(r.left_best_s, r.left_best_c, r.left_best_a);
  if (right) parts.push(`右眼 ${right}`);
  if (left) parts.push(`左眼 ${left}`);
  if (r.right_add || r.left_add) {
    parts.push(`ADD 右${fmtNum(r.right_add)}/左${fmtNum(r.left_add)}`);
  }
  if (r.right_pd || r.left_pd) parts.push(`PD 右${r.right_pd}/左${r.left_pd}`);
  if (Number(r.amount || 0) > 0) {
    parts.push(`金額 NT$${Number(r.amount).toLocaleString("zh-TW")}`);
  }
  return parts.join(" ");
}

function fmtNum(n: any): string {
  if (n === null || n === undefined) return "";
  const num = Number(n);
  return num > 0 ? `+${num}` : `${num}`;
}
