-- Fix critical security vulnerability: Institutions can view all user profiles
-- Remove the overly permissive policy that allows institutions to view ALL user profiles

DROP POLICY IF EXISTS "Institutions can view user profiles" ON public.profiles;

-- Create a secure policy that only allows institutions to view profiles of users 
-- they have a legitimate business relationship with (users they've sent offers to)
CREATE POLICY "Institutions can view profiles of their offer recipients" 
ON public.profiles 
FOR SELECT 
USING (
  CASE
    WHEN (get_user_role(auth.uid()) = 'institution'::text) THEN (
      role = 'user'::text AND 
      EXISTS (
        SELECT 1 FROM public.institution_offers 
        WHERE institution_offers.institution_id = auth.uid() 
        AND institution_offers.user_id = profiles.id
      )
    )
    ELSE (auth.uid() = id)
  END
);