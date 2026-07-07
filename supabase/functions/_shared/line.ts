// LINE Messaging API 共用工具:簽章驗證、回覆、推播
// 文件:https://developers.line.biz/en/reference/messaging-api/

const LINE_API = "https://api.line.me/v2/bot";

// ---------- 型別 ----------
export interface LineTextMessage {
  type: "text";
  text: string;
}
export type LineMessage = LineTextMessage; // 之後可擴充 flex / sticker / image

export interface LineEventSource {
  type: string;
  userId?: string;
  groupId?: string;
  roomId?: string;
}

export interface LineEvent {
  type: string; // follow / unfollow / message / postback ...
  replyToken?: string;
  source?: LineEventSource;
  message?: { type: string; id: string; text?: string };
  timestamp?: number;
}

export interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

// ---------- 簽章驗證 ----------
// LINE 以 Channel Secret 對 request body 做 HMAC-SHA256,base64 後放在 x-line-signature
export async function verifyLineSignature(
  body: string,
  signature: string | null,
  channelSecret: string,
): Promise<boolean> {
  if (!signature || !channelSecret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return timingSafeEqual(expected, signature);
}

// 定長比較,降低時序攻擊風險
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

// ---------- 回覆訊息(免費、需在 reply token 時效內) ----------
export async function replyMessage(
  replyToken: string,
  messages: LineMessage[],
  accessToken: string,
): Promise<boolean> {
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    console.error("LINE reply 失敗", res.status, await res.text());
    return false;
  }
  return true;
}

// ---------- 主動推播(計入月額度,用於生日/行銷) ----------
export async function pushMessage(
  to: string,
  messages: LineMessage[],
  accessToken: string,
): Promise<boolean> {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to, messages }),
  });
  if (!res.ok) {
    console.error("LINE push 失敗", res.status, await res.text());
    return false;
  }
  return true;
}

export function text(t: string): LineTextMessage {
  return { type: "text", text: t };
}
