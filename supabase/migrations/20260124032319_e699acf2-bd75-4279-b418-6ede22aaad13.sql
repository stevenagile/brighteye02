-- 新增會員欄位
ALTER TABLE public.members 
ADD COLUMN gender text,
ADD COLUMN birthday date,
ADD COLUMN address text,
ADD COLUMN occupation text,
ADD COLUMN home_phone text,
ADD COLUMN health_conditions text[] DEFAULT '{}',
ADD COLUMN eye_conditions text[] DEFAULT '{}',
ADD COLUMN eye_surgeries text[] DEFAULT '{}';

-- 為會員表添加索引
CREATE INDEX idx_members_birthday ON public.members(birthday);

-- 刪除舊的處方表，重新建立更完整的版本
DROP TABLE IF EXISTS public.prescriptions;

-- 建立新的驗光記錄表
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 右眼裸視 (SC)
  right_sc_naked TEXT,
  -- 右眼矯正後視力 (CC)
  right_cc_best TEXT,
  
  -- 右眼 - 最佳矯正度數
  right_best_sphere NUMERIC,
  right_best_cylinder NUMERIC,
  right_best_axis INTEGER,
  
  -- 右眼 - 電腦驗光度數
  right_auto_sphere NUMERIC,
  right_auto_cylinder NUMERIC,
  right_auto_axis INTEGER,
  
  -- 右眼 - 原戴眼鏡度數
  right_old_sphere NUMERIC,
  right_old_cylinder NUMERIC,
  right_old_axis INTEGER,
  
  -- 右眼 - 原眼鏡視力/配戴期
  right_old_vision TEXT,
  right_old_years INTEGER,
  
  -- 右眼 ADD / PD
  right_add NUMERIC,
  right_pd NUMERIC,
  
  -- 左眼裸視 (SC)
  left_sc_naked TEXT,
  -- 左眼矯正後視力 (CC)
  left_cc_best TEXT,
  
  -- 左眼 - 最佳矯正度數
  left_best_sphere NUMERIC,
  left_best_cylinder NUMERIC,
  left_best_axis INTEGER,
  
  -- 左眼 - 電腦驗光度數
  left_auto_sphere NUMERIC,
  left_auto_cylinder NUMERIC,
  left_auto_axis INTEGER,
  
  -- 左眼 - 原戴眼鏡度數
  left_old_sphere NUMERIC,
  left_old_cylinder NUMERIC,
  left_old_axis INTEGER,
  
  -- 左眼 - 原眼鏡視力/配戴期
  left_old_vision TEXT,
  left_old_years INTEGER,
  
  -- 左眼 ADD / PD
  left_add NUMERIC,
  left_pd NUMERIC,
  
  -- 其他資訊
  amount NUMERIC DEFAULT 0,
  examiner TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策
CREATE POLICY "允許已驗證用戶查看驗光記錄" ON public.prescriptions 
FOR SELECT USING (true);

CREATE POLICY "允許已驗證用戶新增驗光記錄" ON public.prescriptions 
FOR INSERT WITH CHECK (true);

CREATE POLICY "允許已驗證用戶更新驗光記錄" ON public.prescriptions 
FOR UPDATE USING (true);

CREATE POLICY "允許已驗證用戶刪除驗光記錄" ON public.prescriptions 
FOR DELETE USING (true);

-- 建立索引
CREATE INDEX idx_prescriptions_member_id ON public.prescriptions(member_id);
CREATE INDEX idx_prescriptions_exam_date ON public.prescriptions(exam_date DESC);