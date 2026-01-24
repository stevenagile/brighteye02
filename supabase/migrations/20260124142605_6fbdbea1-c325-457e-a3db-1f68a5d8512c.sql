-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'optician', 'sales');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a security definer function to check if user is staff (any role)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS policies for user_roles table
-- Only admins can view roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage roles  
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive policies on members table
DROP POLICY IF EXISTS "Allow authenticated read members" ON public.members;
DROP POLICY IF EXISTS "Allow authenticated insert members" ON public.members;
DROP POLICY IF EXISTS "Allow authenticated update members" ON public.members;
DROP POLICY IF EXISTS "Allow authenticated delete members" ON public.members;

-- Create secure RLS policies for members table - only staff can access
CREATE POLICY "Staff can read members" ON public.members
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert members" ON public.members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update members" ON public.members
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete members" ON public.members
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Drop existing permissive policies on prescriptions table
DROP POLICY IF EXISTS "Allow authenticated read prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Allow authenticated insert prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Allow authenticated update prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Allow authenticated delete prescriptions" ON public.prescriptions;

-- Create secure RLS policies for prescriptions table - only staff can access
CREATE POLICY "Staff can read prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update prescriptions" ON public.prescriptions
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete prescriptions" ON public.prescriptions
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Drop existing permissive policies on transactions table
DROP POLICY IF EXISTS "Allow authenticated read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated delete transactions" ON public.transactions;

-- Create secure RLS policies for transactions table - only staff can access
CREATE POLICY "Staff can read transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete transactions" ON public.transactions
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Drop existing permissive policies on transaction_items table
DROP POLICY IF EXISTS "Allow authenticated read transaction_items" ON public.transaction_items;
DROP POLICY IF EXISTS "Allow authenticated insert transaction_items" ON public.transaction_items;
DROP POLICY IF EXISTS "Allow authenticated update transaction_items" ON public.transaction_items;
DROP POLICY IF EXISTS "Allow authenticated delete transaction_items" ON public.transaction_items;

-- Create secure RLS policies for transaction_items table - only staff can access
CREATE POLICY "Staff can read transaction_items" ON public.transaction_items
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert transaction_items" ON public.transaction_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update transaction_items" ON public.transaction_items
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete transaction_items" ON public.transaction_items
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));