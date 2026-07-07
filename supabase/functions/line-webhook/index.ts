// ============================================================
// line-webhook — LINE 官方帳號 Webhook 接收端點
//
// 職責:
//   1. 驗證 X-Line-Signature(HMAC-SHA256 + Channel Secret)
//   2. 解析事件並路由:follow / unfollow / message(text)
//   3. 記錄對話(line_message_logs)、維護綁定狀態(line_bindings)
//   4. 以 reply token 回覆(免費)
//
// 綁定:未綁定者輸入「綁定碼」比對 members.bind_code 即完成綁定(階段 2)。
// 客服:已綁定者交由 AI 查本人資料 + FAQ;未綁定者的一般問題走 FAQ 客服(階段 4)。
//
// 所需 Secrets:
//   LINE_CHANNEL_SECRET、LINE_CHANNEL_ACCESS_TOKEN、LOVABLE_API_KEY
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / LOVABLE_API_KEY 通常由環境自動提供)
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

// 綁定碼樣式:8 碼,字元集與 gen_member_bind_code 一致(去除易混淆字元)
const BIND_CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

const CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET") ?? "";
const ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = req.headers.get("x-line-signature");
  const body = await req.text();

  // 1) 簽章驗證 — 未通過一律拒絕
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

  // LINE 要求盡快回 200;個別事件錯誤只記錄、不阻斷整體回應
  await Promise.all(
    events.map((e) =>
      handleEvent(e, supabase).catch((err) => console.error("處理事件錯誤", err))
    ),
  );

  return new Response("OK", { status: 200 });
});

// ---------- 事件路由 ----------
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
      // postback 等其他事件之後再處理
      break;
  }
}

// ---------- 加好友:建立 pending 綁定並歡迎 ----------
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

// ---------- 封鎖/取消好友:標記解除綁定 ----------
async function onUnfollow(lineUserId: string, supabase: SupabaseClient) {
  await supabase
    .from("line_bindings")
    .update({ status: "unbound" })
    .eq("line_user_id", lineUserId);
}

// ---------- 文字訊息:已綁定 → AI 客服 / 未綁定 → 綁定碼或 FAQ 客服 ----------
async function onTextMessage(
  event: LineEvent,
  lineUserId: string,
  supabase: SupabaseClient,
) {
  const incoming = event.message?.text ?? "";

  // 查出綁定狀態
  const { data: binding } = await supabase
    .from("line_bindings")
    .select("member_id, status")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  const boundMemberId =
    binding?.status === "bound" ? binding.member_id ?? null : null;

  await logMessage(supabase, lineUserId, boundMemberId, "inbound", "text", incoming);

  let reply: string;
  let replyMemberId = boundMemberId;

  if (boundMemberId) {
    // AI 智慧客服:依 member_id 抓本人資料 + FAQ,交由 LLM 回答
    try {
      const ai = await answerMemberQuestion(supabase, boundMemberId, incoming);
      reply = ai.content;
    } catch (err) {
      console.error("AI 客服失敗", err);
      reply = "不好意思,查詢服務目前暫時無法使用,請稍後再試,或洽門市人員協助。";
    }
  } else {
    const code = incoming.trim().toUpperCase();

    if (BIND_CODE_RE.test(code)) {
      // 看起來是綁定碼 → 嘗試綁定
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
      // 一般問題 → FAQ 客服(未綁定,不含個資)
      try {
        const ai = await answerGeneralQuestion(supabase, incoming);
        reply = ai.content;
      } catch (err) {
        console.error("FAQ 客服失敗", err);
        reply = "不好意思,服務目前暫時無法使用,請稍後再試,或洽門市人員協助。";
      }
    }
  }

  if (event.replyToken) {
    await replyMessage(event.replyToken, [text(reply)], ACCESS_TOKEN);
    await logMessage(supabase, lineUserId, replyMemberId, "outbound", "text", reply);
  }
}

// ---------- 對話紀錄 ----------
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
