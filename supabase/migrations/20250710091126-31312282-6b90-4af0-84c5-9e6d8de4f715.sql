-- Fix the infinite recursion in RLS policies by using a security definer function
-- First, create a function to safely check user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Institutions can view user profiles" ON public.profiles;

-- Create a new policy using the security definer function
CREATE POLICY "Institutions can view user profiles" 
ON public.profiles 
FOR SELECT 
USING (
  CASE 
    WHEN public.get_user_role(auth.uid()) = 'institution' THEN role = 'user'
    ELSE auth.uid() = id
  END
);