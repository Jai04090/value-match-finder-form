-- Add missing INSERT policy for profiles table
-- This allows users to create their own profile during signup
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Also add a policy for institutions to insert their own profiles
CREATE POLICY "Enable profile creation during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);