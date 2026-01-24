-- Create settings table for store configuration
CREATE TABLE public.settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only staff can read settings
CREATE POLICY "Staff can read settings"
ON public.settings
FOR SELECT
USING (is_staff(auth.uid()));

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES 
('store_info', '{"name": "伯洸眼鏡行", "phone": "02-12345678", "address": "台北市XX區XX路XX號"}'::jsonb),
('member_levels', '{"gold": {"discount": 0.9, "points_multiplier": 2}, "silver": {"discount": 0.95, "points_multiplier": 1.5}, "black": {"discount": 0.85, "points_multiplier": 3}}'::jsonb),
('notifications', '{"low_stock": true, "birthday_reminder": true, "daily_report": false}'::jsonb);