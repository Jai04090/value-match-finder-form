
-- Enable RLS on the form_submissions table
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anonymous users to insert form submissions
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
