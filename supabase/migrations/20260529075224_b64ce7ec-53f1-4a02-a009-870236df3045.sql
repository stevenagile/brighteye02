-- Fix mutable search_path on trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tighten settings policies: scope to authenticated role instead of public
DROP POLICY IF EXISTS "Staff can read settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;

CREATE POLICY "Staff can read settings"
ON public.settings
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can update settings"
ON public.settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Explicitly block any client-side INSERT on user_roles; only service_role / admin paths can add roles
DROP POLICY IF EXISTS "Block client role inserts" ON public.user_roles;
CREATE POLICY "Block client role inserts"
ON public.user_roles
FOR INSERT
TO anon, authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));