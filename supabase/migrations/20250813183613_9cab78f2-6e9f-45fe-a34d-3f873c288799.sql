-- Fix function search path security issues by replacing functions
-- First drop the dependent policy and recreate it
DROP POLICY IF EXISTS "Institutions can view user profiles" ON public.profiles;

-- Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$function$;

-- Recreate the policy that depends on the function
CREATE POLICY "Institutions can view user profiles" 
ON public.profiles 
FOR SELECT 
USING (
  CASE
      WHEN (get_user_role(auth.uid()) = 'institution'::text) THEN (role = 'user'::text)
      ELSE (auth.uid() = id)
  END
);

-- Fix the other function
DROP FUNCTION IF EXISTS public.get_user_profile_with_preferences(uuid);
CREATE OR REPLACE FUNCTION public.get_user_profile_with_preferences(user_uuid uuid)
 RETURNS TABLE(id uuid, email text, created_at timestamp with time zone, updated_at timestamp with time zone, has_preferences boolean, preferences_count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.email,
    p.created_at,
    p.updated_at,
    CASE WHEN fs.user_id IS NOT NULL THEN true ELSE false END as has_preferences,
    COUNT(fs.id) as preferences_count
  FROM public.profiles p
  LEFT JOIN public.form_submissions fs ON p.id = fs.user_id
  WHERE p.id = user_uuid
  GROUP BY p.id, p.email, p.created_at, p.updated_at, fs.user_id;
$function$;