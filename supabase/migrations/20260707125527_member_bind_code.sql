-- ============================================================
-- 階段 2：會員綁定碼（取代簡訊 OTP）
-- 每位會員一組專屬綁定碼，店員提供給客戶，客戶於 LINE 輸入即可綁定。
-- ============================================================

-- 產生 8 碼綁定碼的函式（去除易混淆字元 0/O/1/I）
CREATE OR REPLACE FUNCTION public.gen_member_bind_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result   text := '';
  i        int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 新增欄位
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS bind_code text;

-- 回填現有會員（每列各自產生一組）
UPDATE public.members
  SET bind_code = public.gen_member_bind_code()
  WHERE bind_code IS NULL;

-- 設定預設值與非空、唯一
ALTER TABLE public.members ALTER COLUMN bind_code SET DEFAULT public.gen_member_bind_code();
ALTER TABLE public.members ALTER COLUMN bind_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_bind_code ON public.members(bind_code);

COMMENT ON COLUMN public.members.bind_code IS 'LINE 綁定碼：客戶於 LINE 輸入此碼即可綁定會員';
