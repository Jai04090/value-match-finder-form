-- Fix the remaining function search path issue for handle_new_user
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    year_of_birth, 
    phone_number, 
    income_range, 
    household_members, 
    zip_code,
    role,
    institution_name,
    institution_type,
    full_name
  )
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN new.raw_user_meta_data ->> 'year_of_birth' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'year_of_birth')::integer 
      ELSE NULL 
    END,
    new.raw_user_meta_data ->> 'phone_number',
    new.raw_user_meta_data ->> 'income_range',
    CASE 
      WHEN new.raw_user_meta_data ->> 'household_members' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'household_members')::integer 
      ELSE NULL 
    END,
    new.raw_user_meta_data ->> 'zip_code',
    COALESCE(new.raw_user_meta_data ->> 'role', 'user'),
    new.raw_user_meta_data ->> 'institution_name',
    new.raw_user_meta_data ->> 'institution_type',
    COALESCE(
      new.raw_user_meta_data ->> 'institution_name',
      CONCAT(new.raw_user_meta_data ->> 'first_name', ' ', new.raw_user_meta_data ->> 'last_name')
    )
  );
  RETURN new;
END;
$function$;