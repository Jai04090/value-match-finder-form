
-- Check if RLS is enabled on the table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'form_submissions';

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'form_submissions';

-- Ensure RLS is enabled
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Allow reading form submissions for authenticated users" ON public.form_submissions;

-- Create a more permissive policy for anonymous users to insert
CREATE POLICY "enable_insert_for_anon_users" 
ON public.form_submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create a policy for authenticated users to read (admin purposes)
CREATE POLICY "enable_select_for_authenticated_users" 
ON public.form_submissions 
FOR SELECT 
TO authenticated
USING (true);

-- Grant necessary permissions to anon role
GRANT INSERT ON public.form_submissions TO anon;
GRANT USAGE ON SCHEMA public TO anon;
