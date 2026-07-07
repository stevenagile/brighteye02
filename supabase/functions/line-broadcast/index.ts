// ============================================================
// line-broadcast — 行銷群發推播(由後台店員觸發)
//
// 流程:驗證呼叫者為登入的店員 → 依會員等級找出「已綁定 + 同意通知」的會員
//       → 逐一發送 LINE push,並記錄到 line_push_jobs(type=campaign)。
//
// 驗證:verify_jwt 預設為 true(僅登入者可達),函式內再確認 is_staff。
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

  // 1) 確認呼叫者身分
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "未登入" }, 401);

  const supabase = createServiceClient();
  const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: user.id });
  if (!isStaff) return json({ error: "權限不足" }, 403);

  // 2) 參數
  let body: { levels?: string[]; message?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "參數錯誤" }, 400);
  }
  const levels = body.levels ?? [];
  const message = (body.message ?? "").trim();
  if (!Array.isArray(levels) || levels.length === 0 || !message) {
    return json({ error: "請選擇等級並輸入訊息" }, 400);
  }

  // 3) 收件人:選定等級 + 同意通知 + 已綁定
  const { data: members, error } = await supabase
    .from("members")
    .select("id, name, line_notify_opt_in, line_bindings!inner(line_user_id, status)")
    .in("level", levels)
    .eq("line_notify_opt_in", true)
    .eq("line_bindings.status", "bound");
  if (error) return json({ error: error.message }, 500);

  // 4) 逐一發送
  let sent = 0;
  let failed = 0;
  for (const m of (members ?? []) as any[]) {
    const lineUserId = Array.isArray(m.line_bindings)
      ? m.line_bindings[0]?.line_user_id
      : m.line_bindings?.line_user_id;
    if (!lineUserId) continue;

    const { data: job } = await supabase
      .from("line_push_jobs")
      .insert({
        member_id: m.id,
        line_user_id: lineUserId,
        type: "campaign",
        status: "pending",
        payload: { text: message },
      })
      .select("id")
      .single();

    const ok = await pushMessage(lineUserId, [text(message)], ACCESS_TOKEN);
    if (ok) sent++;
    else failed++;

    if (job) {
      await supabase
        .from("line_push_jobs")
        .update({
          status: ok ? "sent" : "failed",
          sent_at: ok ? new Date().toISOString() : null,
          error: ok ? null : "LINE push failed",
        })
        .eq("id", job.id);
    }
  }

  return json({ total: (members ?? []).length, sent, failed }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
