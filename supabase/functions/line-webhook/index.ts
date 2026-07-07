// ============================================================
// line-webhook — LINE 官方帳號 Webhook 接收端點
//
// 職責:簽章驗證 → 事件路由 → 紀錄對話 → 回覆
// 綁定:未綁定者輸入綁定碼即完成綁定。
// 客服:已綁定→AI 查本人資料+FAQ;未綁定→FAQ 客服。
// 轉真人:AI 回答不出來或客戶要求真人→進真人模式(human_mode),AI 停止自動回覆。
//
// 所需 Secrets:LINE_CHANNEL_SECRET、LINE_CHANNEL_ACCESS_TOKEN、LOVABLE_API_KEY
// ============================================================
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  LineEvent,
  LineWebhookBody,
  replyMessage,
  text,
  verifyLineSignature,
} from "../_shared/line.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { answerGeneralQuestion, answerMemberQuestion } from "../_shared/customerService.ts";

const BIND_CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;
const HUMAN_RE = /真人|專人|人工|客服人員|轉接|轉真人/;

const CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET") ?? "";
const ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = req.headers.get("x-line-signature");
  const body = await req.text();

  if (!(await verifyLineSignature(body, signature, CHANNEL_SECRET))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: LineWebhookBody;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const supabase = createServiceClient();
  const events = payload.events ?? [];

  await Promise.all(
    events.map((e) =>
      handleEvent(e, supabase).catch((err) => console.error("處理事件錯誤", err))
    ),
  );

  return new Response("OK", { status: 200 });
});

async function handleEvent(event: LineEvent, supabase: SupabaseClient) {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  switch (event.type) {
    case "follow":
      await onFollow(event, lineUserId, supabase);
      break;
    case "unfollow":
      await onUnfollow(lineUserId, supabase);
      break;
    case "message":
      if (event.message?.type === "text") {
        await onTextMessage(event, lineUserId, supabase);
      }
      break;
    default:
      break;
  }
}

async function onFollow(
  event: LineEvent,
  lineUserId: string,
  supabase: SupabaseClient,
) {
  await supabase.from("line_bindings").upsert(
    { line_user_id: lineUserId, status: "pending" },
    { onConflict: "line_user_id", ignoreDuplicates: true },
  );

  const msg =
    "歡迎加入伯洸眼鏡！👓\n\n綁定會員後即可查詢您的會員等級、購物金與驗光紀錄。\n請輸入門市提供給您的「綁定碼」(8 碼英數字)以完成綁定。也歡迎直接詢問配鏡、鏡片、驗光等問題。";
  if (event.replyToken) {
    await replyMessage(event.replyToken, [text(msg)], ACCESS_TOKEN);
    await logMessage(supabase, lineUserId, null, "outbound", "text", msg);
  }
}

async function onUnfollow(lineUserId: string, supabase: SupabaseClient) {
  await supabase
    .from("line_bindings")
    .update({ status: "unbound" })
    .eq("line_user_id", lineUserId);
}

async function onTextMessage(
  event: LineEvent,
  lineUserId: string,
  supabase: SupabaseClient,
) {
  const incoming = event.message?.text ?? "";

  const { data: binding } = await supabase
    .from("line_bindings")
    .select("member_id, status, human_mode")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  const boundMemberId =
    binding?.status === "bound" ? binding.member_id ?? null : null;

  await logMessage(supabase, lineUserId, boundMemberId, "inbound", "text", incoming);

  // 已在真人模式:只記錄,不自動回覆(由店員接手)
  if (binding?.human_mode) return;

  let reply = "";
  let replyMemberId = boundMemberId;
  let doHandoff = false;

  if (HUMAN_RE.test(incoming)) {
    doHandoff = true;
  } else if (boundMemberId) {
    try {
      const ai = await answerMemberQuestion(supabase, boundMemberId, incoming);
      if (ai.handoff) doHandoff = true;
      else reply = ai.content;
    } catch (err) {
      console.error("AI 客服失敗", err);
      reply = "不好意思,查詢服務目前暫時無法使用,請稍後再試,或洽門市人員協助。";
    }
  } else {
    const code = incoming.trim().toUpperCase();
    if (BIND_CODE_RE.test(code)) {
      const { data: member } = await supabase
        .from("members")
        .select("id, name")
        .eq("bind_code", code)
        .maybeSingle();

      if (member) {
        await supabase.from("line_bindings").upsert(
          {
            line_user_id: lineUserId,
            member_id: member.id,
            status: "bound",
            bound_at: new Date().toISOString(),
          },
          { onConflict: "line_user_id" },
        );
        replyMemberId = member.id;
        reply = `綁定成功!${member.name} 您好 👓\n之後可直接在此查詢您的會員資料。`;
      } else {
        reply =
          "綁定碼不正確。請輸入門市提供給您的 8 碼綁定碼(英數字),或洽門市人員協助。";
      }
    } else {
      try {
        const ai = await answerGeneralQuestion(supabase, incoming);
        if (ai.handoff) doHandoff = true;
        else reply = ai.content;
      } catch (err) {
        console.error("FAQ 客服失敗", err);
        reply = "不好意思,服務目前暫時無法使用,請稍後再試,或洽門市人員協助。";
      }
    }
  }

  if (doHandoff) {
    await enterHumanMode(supabase, lineUserId);
    reply =
      "已為您轉接真人客服,我們會盡快回覆您 🙇\n在此期間您的訊息將由專人處理。";
  }

  if (event.replyToken && reply) {
    await replyMessage(event.replyToken, [text(reply)], ACCESS_TOKEN);
    await logMessage(supabase, lineUserId, replyMemberId, "outbound", "text", reply);
  }
}

// 進入真人模式(保留現有綁定欄位)
async function enterHumanMode(supabase: SupabaseClient, lineUserId: string) {
  const now = new Date().toISOString();
  const { data: upd } = await supabase
    .from("line_bindings")
    .update({ human_mode: true, handoff_at: now })
    .eq("line_user_id", lineUserId)
    .select("id");
  if (!upd || upd.length === 0) {
    await supabase.from("line_bindings").insert({
      line_user_id: lineUserId,
      status: "pending",
      human_mode: true,
      handoff_at: now,
    });
  }
}

async function logMessage(
  supabase: SupabaseClient,
  lineUserId: string,
  memberId: string | null,
  direction: "inbound" | "outbound",
  messageType: string,
  content: string,
) {
  const { error } = await supabase.from("line_message_logs").insert({
    line_user_id: lineUserId,
    member_id: memberId,
    direction,
    message_type: messageType,
    content,
  });
  if (error) console.error("寫入 line_message_logs 失敗", error);
}
