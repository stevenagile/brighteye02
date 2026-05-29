TRUNCATE TABLE public.transaction_items, public.transactions, public.prescriptions, public.members RESTART IDENTITY CASCADE;
DELETE FROM public.settings;