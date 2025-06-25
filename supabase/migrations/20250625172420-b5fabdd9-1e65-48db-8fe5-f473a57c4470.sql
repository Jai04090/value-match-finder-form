
-- First, let's check current policies on form_submissions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'form_submissions';

-- Drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow anonymous form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Allow reading form submissions for authenticated users" ON public.form_submissions;

-- Create the correct policy to allow anonymous users to insert form submissions
CREATE POLICY "Allow anonymous form submissions" 
ON public.form_submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create a policy to allow reading form submissions (if needed for admin purposes later)
CREATE POLICY "Allow reading form submissions for authenticated users" 
ON public.form_submissions 
FOR SELECT 
TO authenticated
USING (true);
