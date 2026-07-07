-- ============================================================
-- LINE 官方帳號整合 — 資料表 migration
-- 內容:LINE 帳號綁定、OTP 驗證、對話紀錄、推播工作佇列
-- 設計原則:
--   * Edge Function 以 service_role 存取(繞過 RLS)負責寫入
--   * 店員後台(authenticated)僅能依 is_staff 讀取/管理必要資料
--   * OTP 表含敏感驗證碼雜湊,僅開放 service_role(不建立任何 policy)
-- ============================================================

-- ---------- Enums ----------
CREATE TYPE public.line_binding_status AS ENUM ('pending', 'bound', 'unbound');
CREATE TYPE public.line_message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE public.line_push_type AS ENUM ('birthday', 'campaign', 'system');
CREATE TYPE public.line_push_status AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- ---------- members:新增 LINE 通知同意欄位 ----------
-- 綁定視為取得同意,預設允許通知;客戶可退訂(opt-out)後設為 false
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS line_notify_opt_in boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.members.line_notify_opt_in IS '是否同意接收 LINE 主動推播(生日/行銷通知)';

-- ============================================================
-- 1. line_bindings — LINE 帳號 ↔ 會員綁定
-- ============================================================
CREATE TABLE public.line_bindings (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id  TEXT NOT NULL UNIQUE,                    -- LINE 使用者 ID(來自 webhook)
  member_id     UUID REFERENCES public.members(id) ON DELETE SET NULL, -- 綁定成功前為 null
  display_name  TEXT,                                    -- LINE 顯示名稱
  status        public.line_binding_status NOT NULL DEFAULT 'pending',
  bound_at      TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_bindings_member_id ON public.line_bindings(member_id);
CREATE INDEX idx_line_bindings_status ON public.line_bindings(status);

ALTER TABLE public.line_bindings ENABLE ROW LEVEL SECURITY;

-- 店員可查看綁定狀態
CREATE POLICY "Staff can read line_bindings" ON public.line_bindings
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- 店員可更新綁定(例如手動解除綁定)
CREATE POLICY "Staff can update line_bindings" ON public.line_bindings
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER update_line_bindings_updated_at
  BEFORE UPDATE ON public.line_bindings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. line_otp_challenges — 手機 OTP 驗證挑戰(僅 service_role 存取)
-- ============================================================
CREATE TABLE public.line_otp_challenges (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id  TEXT NOT NULL,
  phone         TEXT NOT NULL,
  code_hash     TEXT NOT NULL,                           -- OTP 雜湊,不存明碼
  expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,       -- 建議 5 分鐘失效
  attempts      INTEGER NOT NULL DEFAULT 0,              -- 已嘗試次數,超過鎖定
  verified_at   TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_otp_line_user_id ON public.line_otp_challenges(line_user_id);
CREATE INDEX idx_line_otp_expires_at ON public.line_otp_challenges(expires_at);

-- 啟用 RLS 且「不建立任何 policy」→ 只有 service_role(Edge Function)可存取
ALTER TABLE public.line_otp_challenges ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. line_message_logs — 對話紀錄(稽核 / 客服品質 / 個資存取軌跡)
-- ============================================================
CREATE TABLE public.line_message_logs (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id  TEXT NOT NULL,
  member_id     UUID REFERENCES public.members(id) ON DELETE SET NULL,
  direction     public.line_message_direction NOT NULL,
  message_type  TEXT,                                    -- text / sticker / image ...
  content       TEXT,
  intent        TEXT,                                    -- AI 判斷的意圖(選填)
  tokens        INTEGER,                                 -- LLM token 用量(選填)
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_logs_line_user_id ON public.line_message_logs(line_user_id);
CREATE INDEX idx_line_logs_member_id ON public.line_message_logs(member_id);
CREATE INDEX idx_line_logs_created_at ON public.line_message_logs(created_at DESC);

ALTER TABLE public.line_message_logs ENABLE ROW LEVEL SECURITY;

-- 店員可讀取對話紀錄(寫入由 service_role 進行)
CREATE POLICY "Staff can read line_message_logs" ON public.line_message_logs
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- ============================================================
-- 4. line_push_jobs — 推播工作佇列與紀錄(生日 / 行銷)
-- ============================================================
CREATE TABLE public.line_push_jobs (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id     UUID REFERENCES public.members(id) ON DELETE SET NULL,
  line_user_id  TEXT,
  type          public.line_push_type NOT NULL DEFAULT 'campaign',
  status        public.line_push_status NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at       TIMESTAMP WITH TIME ZONE,
  payload       JSONB NOT NULL DEFAULT '{}',             -- 訊息內容(text / flex ...)
  error         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_push_status ON public.line_push_jobs(status);
CREATE INDEX idx_line_push_scheduled_for ON public.line_push_jobs(scheduled_for);
CREATE INDEX idx_line_push_member_id ON public.line_push_jobs(member_id);

ALTER TABLE public.line_push_jobs ENABLE ROW LEVEL SECURITY;

-- 店員可查看推播結果
CREATE POLICY "Staff can read line_push_jobs" ON public.line_push_jobs
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- 店員可建立行銷推播工作
CREATE POLICY "Staff can insert line_push_jobs" ON public.line_push_jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

-- 店員可更新推播工作(例如取消 / 重試)
CREATE POLICY "Staff can update line_push_jobs" ON public.line_push_jobs
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER update_line_push_jobs_updated_at
  BEFORE UPDATE ON public.line_push_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
