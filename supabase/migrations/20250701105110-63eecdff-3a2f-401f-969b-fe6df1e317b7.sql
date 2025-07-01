
-- Add new columns to profiles table for additional user details
ALTER TABLE public.profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN year_of_birth integer,
ADD COLUMN phone_number text,
ADD COLUMN income_range text,
ADD COLUMN household_members integer,
ADD COLUMN zip_code text;

-- Update the handle_new_user function to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
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
    zip_code
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
    new.raw_user_meta_data ->> 'zip_code'
  );
  RETURN new;
END;
$$;
