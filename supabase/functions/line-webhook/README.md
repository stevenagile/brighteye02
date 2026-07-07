# line-webhook — 部署與設定說明

LINE 官方帳號 Webhook 接收端點(階段 1 骨架)。負責簽章驗證、事件路由與回覆。

## 前置需求

1. 已建立 **LINE 官方帳號**並於 [LINE Developers](https://developers.line.biz/) 開通 **Messaging API** channel。
2. 取得以下憑證(LINE Developers → 你的 channel):
   - **Channel secret**(Basic settings)
   - **Channel access token**(Messaging API → 發行長期 token)
3. 已安裝並登入 [Supabase CLI](https://supabase.com/docs/guides/cli)。

## 設定 Secrets

```bash
supabase secrets set LINE_CHANNEL_SECRET="你的_channel_secret"
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN="你的_channel_access_token"
```

> `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY` 由 Edge 執行環境自動注入,不需手動設定。
> 這些金鑰**只放 Supabase Secrets**,切勿寫進前端或 commit 進版控。

## 部署

```bash
# 先套用資料表 migration(PR #1)
supabase db push

# 部署函式
supabase functions deploy line-webhook
```

部署後的 URL 形如:
```
https://<PROJECT_REF>.supabase.co/functions/v1/line-webhook
```

## 設定 LINE Webhook URL

在 LINE Developers → Messaging API:
1. **Webhook URL** 填入上方函式 URL。
2. 開啟 **Use webhook**。
3. 按 **Verify** 測試(應回 200)。
4. 建議關閉「自動回覆訊息 / 加入好友的歡迎訊息」,改由本函式處理。

## 測試

- 用手機加官方帳號好友 → 應收到歡迎訊息(follow 事件)。
- 傳任意文字 → 未綁定會收到「請輸入手機號碼綁定」;已綁定(階段 2 後)會 echo 佔位回覆。
- 於 Supabase 檢查 `line_message_logs` 是否有 inbound/outbound 紀錄。

## 目前範圍與後續(TODO)

| 狀態 | 項目 |
|---|---|
| ✅ | 簽章驗證、事件路由、follow/unfollow、訊息紀錄、回覆骨架 |
| ⏳ 階段 2 | 手機 + OTP 綁定流程(`send-otp` 函式、`line_otp_challenges`) |
| ⏳ 階段 4 | AI 智慧客服(`line-cs`:LLM + 依 member_id 過濾的查詢工具) |
| ⏳ 階段 5 | 生日推播(`birthday-push` + pg_cron) |
