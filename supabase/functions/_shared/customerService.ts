// AI 智慧客服：依 member_id 抓「本人」資料 + 門市 FAQ，組 prompt 交給 LLM 回答。
// 安全設計：LLM 不直接存取資料庫，只收到已過濾好的本人資料摘要。
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, ChatMessage } from "./ai.ts";

const LEVEL_LABEL: Record<string, string> = {
  regular: "一般客戶",
  silver: "VIP 銀卡",
  gold: "VIP 金卡",
  black: "VIP 黑卡",
};

const SYSTEM_PROMPT = `你是「伯洸眼鏡」官方帳號的客服助理。請嚴格遵守:
1. 只根據下方「會員資料」與「門市資訊」回答;這些都是「當前這位會員本人」的資料。
2. 若問題超出所提供資料的範圍（例如他人資料、你沒有的資訊），請禮貌說明你沒有該資訊並建議洽門市人員，切勿編造或臆測。
3. 一律以繁體中文回答，語氣親切、簡潔，適合手機閱讀，避免冗長。
4. 涉及金額、度數等數字時，一律使用資料中的實際數值，不可虛構。
5. 不要透露內部欄位名稱、系統或資料庫細節。`;

interface AnswerResult {
  content: string;
  tokens: number | null;
}

export async function answerMemberQuestion(
  supabase: SupabaseClient,
  memberId: string,
  question: string,
): Promise<AnswerResult> {
  // 會員本人基本資料
  const { data: member } = await supabase
    .from("members")
    .select("name, level, shopping_credit, coupon_count, vip_amount, birthday")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return { content: "查無您的會員資料，請洽門市人員協助。", tokens: null };
  }

  // 近期驗光/服務紀錄（最多 5 筆）
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

  // 近期消費紀錄（最多 5 筆）
  const { data: tx } = await supabase
    .from("transactions")
    .select("transaction_date, total, payment_method")
    .eq("member_id", memberId)
    .order("transaction_date", { ascending: false })
    .limit(5);

  // 門市資訊
  const { data: storeRow } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "store_info")
    .maybeSingle();
  const store = (storeRow?.value ?? {}) as Record<string, unknown>;

  const creditUsed = (rx ?? []).reduce(
    (s: number, r: any) => s + Number(r.credit_used || 0),
    0,
  );
  const remaining = Number((member as any).shopping_credit || 0) - creditUsed;

  const context = buildContext(member as any, rx ?? [], tx ?? [], store, remaining);

  const messages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
    { role: "user", content: question },
  ];

  const result = await callLovableAI(messages);
  return { content: result.content, tokens: result.tokens };
}

// ---------- 組裝提供給 LLM 的本人資料摘要 ----------
function buildContext(
  member: any,
  rx: any[],
  tx: any[],
  store: Record<string, unknown>,
  remaining: number,
): string {
  const lines: string[] = [];

  lines.push("【會員資料】");
  lines.push(`姓名：${member.name}`);
  lines.push(`會員等級：${LEVEL_LABEL[member.level] ?? member.level}`);
  lines.push(`購物金餘額：NT$${Math.round(remaining).toLocaleString("zh-TW")}`);
  lines.push(`購物券張數：${member.coupon_count ?? 0}`);
  if (Number(member.vip_amount || 0) > 0) {
    lines.push(`VIP 金額：NT$${Number(member.vip_amount).toLocaleString("zh-TW")}`);
  }
  if (member.birthday) lines.push(`生日：${member.birthday}`);

  if (rx.length) {
    lines.push("");
    lines.push("【近期驗光/服務紀錄】");
    for (const r of rx) {
      lines.push(formatPrescription(r));
    }
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
  lines.push("【門市資訊】");
  if (store.name) lines.push(`店名：${store.name}`);
  if (store.phone) lines.push(`電話：${store.phone}`);
  if (store.address) lines.push(`地址：${store.address}`);

  return lines.join("\n");
}

// 將單筆驗光紀錄壓成一行（略過空值）
function formatPrescription(r: any): string {
  const parts: string[] = [`- ${r.exam_date}`];
  if (r.service_type) parts.push(String(r.service_type));
  if (r.examiner) parts.push(`驗光師：${r.examiner}`);

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
