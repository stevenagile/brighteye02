-- Add VIP membership fields to members table
ALTER TABLE public.members 
ADD COLUMN vip_amount numeric DEFAULT 0,
ADD COLUMN vip_start_date date DEFAULT NULL;