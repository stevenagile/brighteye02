# birthday-push — 生日推播設定說明

每日排程，對「今天生日 + 已綁定 LINE + 同意通知（`line_notify_opt_in`）」的會員發送 LINE 生日祝福。

## 所需 Secrets

| 名稱 | 說明 |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | 已於階段 1 設定 |
| `CRON_SECRET` | **新增**：自訂一組隨機字串（如 32 碼），用來驗證排程呼叫來源 |

在 Lovable Cloud → **Secrets** 新增 `CRON_SECRET`（值自訂，例如一段亂數）。

## 部署

合併後在 Lovable 對話框說「請部署 birthday-push edge function」。
函式 URL：`https://wkrfmqzjzverngggiaiq.supabase.co/functions/v1/birthday-push`

## 設定每日排程（SQL editor）

在 **SQL editor** 貼上以下 SQL 並執行（**把 `請填入你的CRON_SECRET` 換成你剛設的值**）：

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 每天台灣時間 09:00（= UTC 01:00）觸發
select cron.schedule(
  'birthday-push-daily',
  '0 1 * * *',
  $$
  select net.http_post(
    url := 'https://wkrfmqzjzverngggiaiq.supabase.co/functions/v1/birthday-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '請填入你的CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

> 台灣無日光節約時間，UTC+8 固定，故 `0 1 * * *`（UTC）即每日台灣 09:00。
> 要改時間就改 cron 的小時（台灣時間 - 8 = UTC 小時）。

### 管理排程

```sql
-- 查看已排程工作
select * from cron.job;

-- 取消排程
select cron.unschedule('birthday-push-daily');
```

## 測試（不實際發送）

用 dry-run 先確認名單：

```bash
curl -X POST 'https://wkrfmqzjzverngggiaiq.supabase.co/functions/v1/birthday-push' \
  -H 'Content-Type: application/json' \
  -H 'x-cron-secret: 你的CRON_SECRET' \
  -d '{"dry_run": true}'
```

回傳會列出今天生日、符合條件的會員名單（不發送）。把 `dry_run` 拿掉即實際發送。

> 想立即驗證流程，可先把某位已綁定會員的生日暫時改成今天，用 dry-run 確認有出現在名單。

## 注意

- 主動推播計入 LINE 官方帳號**月額度**（免費方案每月 200 則），只發給已綁定且 opt-in 的會員。
- 當日重複觸發會自動去重（同一會員一天只發一次）。
