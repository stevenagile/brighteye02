
-- 會員等級 enum
CREATE TYPE public.member_level AS ENUM ('gold', 'silver', 'black');

-- 付款方式 enum
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'transfer');

-- 交易項目類型 enum
CREATE TYPE public.item_type AS ENUM ('frame', 'lens', 'exam', 'accessory', 'other');

-- 會員資料表
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  level member_level NOT NULL DEFAULT 'silver',
  shopping_credit NUMERIC NOT NULL DEFAULT 0,
  coupon_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  gender TEXT,
  birthday DATE,
  address TEXT,
  occupation TEXT,
  home_phone TEXT,
  health_conditions TEXT[] DEFAULT '{}',
  eye_conditions TEXT[] DEFAULT '{}',
  eye_surgeries TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 交易記錄表
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  prescription_id UUID, -- 稍後加入外鍵關聯
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  credit_used NUMERIC NOT NULL DEFAULT 0,
  coupon_used INTEGER NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 交易明細表
CREATE TABLE public.transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  item_type item_type NOT NULL DEFAULT 'other',
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 驗光記錄表 (完整的驗光數據)
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 右眼數據
  right_sc TEXT, -- 裸視 (SC)
  right_cc TEXT, -- 矯正視力 (CC)
  right_best_s NUMERIC, -- 最佳度數 球面 (S)
  right_best_c NUMERIC, -- 最佳度數 散光 (C)
  right_best_a INTEGER, -- 最佳度數 軸度 (A)
  right_auto_s NUMERIC, -- 電腦驗光 球面
  right_auto_c NUMERIC, -- 電腦驗光 散光
  right_auto_a INTEGER, -- 電腦驗光 軸度
  right_old_s NUMERIC, -- 舊眼鏡度數 球面
  right_old_c NUMERIC, -- 舊眼鏡度數 散光
  right_old_a INTEGER, -- 舊眼鏡度數 軸度
  right_old_va TEXT, -- 舊眼鏡視力
  right_old_year INTEGER, -- 舊眼鏡年份
  right_add NUMERIC, -- 老花加入度
  right_pd NUMERIC, -- 瞳距
  
  -- 左眼數據
  left_sc TEXT,
  left_cc TEXT,
  left_best_s NUMERIC,
  left_best_c NUMERIC,
  left_best_a INTEGER,
  left_auto_s NUMERIC,
  left_auto_c NUMERIC,
  left_auto_a INTEGER,
  left_old_s NUMERIC,
  left_old_c NUMERIC,
  left_old_a INTEGER,
  left_old_va TEXT,
  left_old_year INTEGER,
  left_add NUMERIC,
  left_pd NUMERIC,
  
  -- 其他
  amount NUMERIC DEFAULT 0, -- 驗光費用
  examiner TEXT, -- 驗光師
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 添加交易表的驗光記錄外鍵
ALTER TABLE public.transactions 
ADD CONSTRAINT fk_transactions_prescription 
FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE SET NULL;

-- 啟用 RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- 建立公開讀取政策 (店家管理系統，所有登入用戶可讀取)
CREATE POLICY "Allow authenticated read members" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert members" ON public.members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update members" ON public.members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete members" ON public.members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read transactions" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update transactions" ON public.transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete transactions" ON public.transactions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read transaction_items" ON public.transaction_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert transaction_items" ON public.transaction_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update transaction_items" ON public.transaction_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete transaction_items" ON public.transaction_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete prescriptions" ON public.prescriptions FOR DELETE TO authenticated USING (true);

-- 建立更新時間戳的函數
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
