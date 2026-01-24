-- 建立會員等級枚舉
CREATE TYPE public.member_level AS ENUM ('gold', 'silver', 'black');

-- 建立支付方式枚舉
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'transfer');

-- 建立商品類型枚舉
CREATE TYPE public.item_type AS ENUM ('frame', 'lens', 'exam', 'accessory', 'other');

-- 建立會員資料表
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  level member_level NOT NULL DEFAULT 'silver',
  shopping_credit DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 建立驗光記錄表
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  right_sphere DECIMAL(5,2),
  right_cylinder DECIMAL(5,2),
  right_axis INTEGER,
  left_sphere DECIMAL(5,2),
  left_cylinder DECIMAL(5,2),
  left_axis INTEGER,
  pd DECIMAL(4,1),
  notes TEXT,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 建立交易記錄表
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  credit_used DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_used INTEGER NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 建立交易明細表
CREATE TABLE public.transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  item_type item_type NOT NULL DEFAULT 'other',
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- 公開讀取政策（店員系統，所有登入用戶可存取）
CREATE POLICY "允許已驗證用戶查看會員" ON public.members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶新增會員" ON public.members
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "允許已驗證用戶更新會員" ON public.members
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶刪除會員" ON public.members
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶查看驗光記錄" ON public.prescriptions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶新增驗光記錄" ON public.prescriptions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "允許已驗證用戶更新驗光記錄" ON public.prescriptions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶刪除驗光記錄" ON public.prescriptions
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶查看交易" ON public.transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶新增交易" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "允許已驗證用戶更新交易" ON public.transactions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶刪除交易" ON public.transactions
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶查看交易明細" ON public.transaction_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶新增交易明細" ON public.transaction_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "允許已驗證用戶更新交易明細" ON public.transaction_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "允許已驗證用戶刪除交易明細" ON public.transaction_items
  FOR DELETE TO authenticated USING (true);

-- 建立更新時間戳記函數
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 會員更新時間觸發器
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 建立索引以提升查詢效能
CREATE INDEX idx_members_phone ON public.members(phone);
CREATE INDEX idx_members_level ON public.members(level);
CREATE INDEX idx_prescriptions_member_id ON public.prescriptions(member_id);
CREATE INDEX idx_transactions_member_id ON public.transactions(member_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);