-- 更新預設值為 'regular'
ALTER TABLE public.members ALTER COLUMN level SET DEFAULT 'regular'::member_level;