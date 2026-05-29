UPDATE public.settings 
SET value = value || '{"regular": {"discount": 1, "points_multiplier": 1, "vip_amount": 0, "shopping_credit": 0}}'::jsonb
WHERE key = 'member_levels';