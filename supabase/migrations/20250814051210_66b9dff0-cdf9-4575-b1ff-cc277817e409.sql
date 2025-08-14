-- Fix RLS policy to allow institutions to view user profiles in user directory
-- This is needed for legitimate business functionality while maintaining security

-- First, let's check if there's an existing policy that needs to be replaced
DROP POLICY IF EXISTS "Institutions can view profiles of their offer recipients" ON public.profiles;

-- Create a secure policy that allows institutions to view user profiles
-- but restricts them to only see users (not other institutions or staff)
CREATE POLICY "Institutions can view user profiles for directory" 
ON public.profiles 
FOR SELECT 
USING (
  CASE
    -- If the requesting user is an institution, they can see user profiles
    WHEN (get_user_role(auth.uid()) = 'institution'::text) THEN (
      role = 'user'::text
    )
    -- All other users can only see their own profile
    ELSE (auth.uid() = id)
  END
);