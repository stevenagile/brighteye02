-- Add service_type column to prescriptions table
ALTER TABLE public.prescriptions 
ADD COLUMN service_type text DEFAULT '驗光';

-- Add comment for documentation
COMMENT ON COLUMN public.prescriptions.service_type IS 'Service type: 驗光, 配鏡, 鏡架, 維護';