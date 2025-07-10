-- Update the role check constraint to include 'staff' role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the updated constraint that includes 'staff' role
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'institution', 'staff'));