// ============================================================
// line-webhook — LINE 官方帳號 Webhook 接收端點(階段 1 骨架)
//
// 職責:
//   1. 驗證 X-Line-Signature(HMAC-SHA256 + Channel Secret)
//   2. 解析事件並路由:follow / unfollow / message(text)
//   3. 記錄對話(line_message_logs)、維護綁定狀態(line_bindings)
//   4. 以 reply token 回覆(免費)
//
// 注意:目前訊息處理為「骨架」— 綁定 OTP(階段 2)與 AI 客服(階段 4)
//       尚未實作,已綁定者先以 echo 佔位,未綁定者引導綁定。
//
// 所需 Secrets(supabase secrets set):
//   LINE_CHANNEL_SECRET、LINE_CHANNEL_ACCESS_TOKEN
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 由執行環境自動注入)
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
    "歡迎加入伯洸眼鏡！👓\n\n綁定會員後即可查詢您的會員等級、購物金與驗光紀錄。\n請輸入您登記的手機號碼開始綁定。";
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

// ---------- 文字訊息:骨架(已綁定 echo / 未綁定引導) ----------
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

  await logMessage(
    supabase,
    lineUserId,
    binding?.member_id ?? null,
    "inbound",
    "text",
    incoming,
  );

  let reply: string;
  if (binding?.status === "bound" && binding.member_id) {
    // TODO(階段 4):改為呼叫 line-cs(LLM + 依 member_id 過濾的查詢工具)
    reply = `（智慧客服開發中）您說的是:「${incoming}」`;
  } else {
    // TODO(階段 2):實作手機 + OTP 綁定流程
    reply = "您尚未完成會員綁定。請輸入您登記的手機號碼以進行綁定。";
  }

  if (event.replyToken) {
    await replyMessage(event.replyToken, [text(reply)], ACCESS_TOKEN);
    await logMessage(
      supabase,
      lineUserId,
      binding?.member_id ?? null,
      "outbound",
      "text",
      reply,
    );
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
