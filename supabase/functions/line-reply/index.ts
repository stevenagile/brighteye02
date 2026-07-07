// ============================================================
// line-reply — 店員從後台回覆客戶(真人客服)
//
// 驗證:verify_jwt 預設 true(僅登入者),函式內再確認 is_staff。
// 所需 Secrets:LINE_CHANNEL_ACCESS_TOKEN
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pushMessage, text } from "../_shared/line.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "未登入" }, 401);

  const supabase = createServiceClient();
  const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: user.id });
  if (!isStaff) return json({ error: "權限不足" }, 403);

  let body: { line_user_id?: string; message?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "參數錯誤" }, 400);
  }
  const lineUserId = body.line_user_id ?? "";
  const message = (body.message ?? "").trim();
  if (!lineUserId || !message) return json({ error: "參數不完整" }, 400);

  const { data: b } = await supabase
    .from("line_bindings")
    .select("member_id")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  const ok = await pushMessage(lineUserId, [text(message)], ACCESS_TOKEN);
  if (!ok) return json({ error: "LINE push 失敗" }, 502);

  await supabase.from("line_message_logs").insert({
    line_user_id: lineUserId,
    member_id: b?.member_id ?? null,
    direction: "outbound",
    message_type: "text",
    content: message,
  });

  return json({ ok: true }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
