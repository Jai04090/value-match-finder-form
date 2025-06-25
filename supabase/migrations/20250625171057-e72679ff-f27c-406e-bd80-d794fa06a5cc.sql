
-- Update the RLS policy to allow anonymous users to insert form submissions
-- This will replace the existing policy that was blocking submissions

DROP POLICY IF EXISTS "Allow public form submissions" ON public.form_submissions;

CREATE POLICY "Allow public form submissions" 
  ON public.form_submissions 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Also ensure the policy for reading submissions allows authenticated users
DROP POLICY IF EXISTS "Allow reading form submissions" ON public.form_submissions;

CREATE POLICY "Allow reading form submissions" 
  ON public.form_submissions 
  FOR SELECT 
  TO authenticated 
  USING (true);
