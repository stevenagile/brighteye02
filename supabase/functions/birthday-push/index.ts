// ============================================================
// birthday-push — 生日推播（每日排程觸發）
//
// 流程:找出「今天生日（台灣時區）+ 已綁定 LINE + 同意通知」的會員，
//       發送 LINE 生日祝福，並記錄到 line_push_jobs（含當日去重）。
//
// 呼叫保護:需帶 x-cron-secret 標頭且與 CRON_SECRET 相符。
// 測試:body 傳 {"dry_run": true} 只列出名單、不實際發送。
//
// 所需 Secrets:LINE_CHANNEL_ACCESS_TOKEN、CRON_SECRET
// ============================================================
import { pushMessage, text } from "../_shared/line.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

Deno.serve(async (req: Request) => {
  // 驗證呼叫來源
  if (!CRON_SECRET) {
    return new Response("CRON_SECRET 尚未設定", { status: 500 });
  }
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  let opts: { dry_run?: boolean } = {};
  try {
    opts = await req.json();
  } catch {
    // 空 body 可接受
  }

  const supabase = createServiceClient();

  // 今天（台灣時區）的月-日與完整日期
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const mm = parts.find((p) => p.type === "month")!.value;
  const dd = parts.find((p) => p.type === "day")!.value;
  const todayMD = `${mm}-${dd}`;
  const todayISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
  }).format(now); // YYYY-MM-DD

  // 已綁定 + 同意通知 + 有生日的會員
  const { data: members, error } = await supabase
    .from("members")
    .select(
      "id, name, birthday, line_notify_opt_in, line_bindings!inner(line_user_id, status)",
    )
    .eq("line_notify_opt_in", true)
    .eq("line_bindings.status", "bound")
    .not("birthday", "is", null);

  if (error) {
    console.error("查詢生日會員失敗", error);
    return json({ error: error.message }, 500);
  }

  // 篩出今天生日者（比對月-日）
  const recipients = (members ?? []).filter((m: any) => {
    return String(m.birthday).slice(5) === todayMD; // YYYY-MM-DD → MM-DD
  });

  const results: Array<Record<string, unknown>> = [];

  for (const m of recipients as any[]) {
    const lineUserId = Array.isArray(m.line_bindings)
      ? m.line_bindings[0]?.line_user_id
      : m.line_bindings?.line_user_id;
    if (!lineUserId) {
      results.push({ member: m.name, skipped: "無 line_user_id" });
      continue;
    }

    // 當日去重:今天是否已建立過生日推播
    const { data: existing } = await supabase
      .from("line_push_jobs")
      .select("id")
      .eq("member_id", m.id)
      .eq("type", "birthday")
      .gte("created_at", `${todayISO}T00:00:00+08:00`)
      .limit(1);
    if (existing && existing.length > 0) {
      results.push({ member: m.name, skipped: "今日已發送" });
      continue;
    }

    const msg =
      `🎂 ${m.name} 生日快樂!\n伯洸眼鏡祝您生日愉快、視野清晰 👓\n` +
      `近期蓞臨門市可享生日專屬優惠，期待為您服務!`;

    if (opts.dry_run) {
      results.push({ member: m.name, dryRun: true });
      continue;
    }

    // 建立推播工作
    const { data: job } = await supabase
      .from("line_push_jobs")
      .insert({
        member_id: m.id,
        line_user_id: lineUserId,
        type: "birthday",
        status: "pending",
        payload: { text: msg },
      })
      .select("id")
      .single();

    const ok = await pushMessage(lineUserId, [text(msg)], ACCESS_TOKEN);

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
    results.push({ member: m.name, sent: ok });
  }

  return json({ date: todayISO, matched: recipients.length, results }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
