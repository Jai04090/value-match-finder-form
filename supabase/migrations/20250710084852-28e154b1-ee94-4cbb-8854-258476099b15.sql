-- Add institution-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN institution_name text,
ADD COLUMN institution_type text;

-- Add constraint for institution_type values
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_institution_type_check 
CHECK (institution_type IS NULL OR institution_type IN ('Bank', 'Credit Union'));