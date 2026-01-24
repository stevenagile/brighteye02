-- 新增 'regular' 到 member_level enum
ALTER TYPE public.member_level ADD VALUE IF NOT EXISTS 'regular';