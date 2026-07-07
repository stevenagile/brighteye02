-- ============================================================
-- 真人客服接手:開啟後 AI 不自動回覆,由店員接手
-- ============================================================
ALTER TABLE public.line_bindings
  ADD COLUMN IF NOT EXISTS human_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS handoff_at timestamptz;

COMMENT ON COLUMN public.line_bindings.human_mode IS '真人客服模式:開啟時 AI 不自動回覆,由店員接手';
