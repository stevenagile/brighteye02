-- Add credit fields to prescriptions table
ALTER TABLE public.prescriptions 
ADD COLUMN credit_used numeric DEFAULT 0,
ADD COLUMN credit_remaining numeric DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.prescriptions.credit_used IS '本次折抵購物金金額';
COMMENT ON COLUMN public.prescriptions.credit_remaining IS '折抵後剩餘購物金';