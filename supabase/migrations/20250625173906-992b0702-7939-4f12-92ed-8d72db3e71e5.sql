
-- Create the form_submissions table to store all form data
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Basic Information
  current_financial_institution TEXT,
  looking_for TEXT,
  current_employer TEXT,
  student_or_alumni TEXT,
  
  -- Religious Preferences
  religious_organization TEXT,
  sharia_compliant BOOLEAN DEFAULT false,
  religion TEXT,
  
  -- Military Service
  current_or_former_military TEXT,
  military_branch TEXT,
  
  -- Values Preferences
  environmental_initiatives BOOLEAN DEFAULT false,
  diversity_equity_inclusion BOOLEAN DEFAULT false,
  
  -- Metadata for analytics/security
  submission_ip TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert (public form)
CREATE POLICY "Allow anonymous form submissions" 
ON public.form_submissions 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Create policy for authenticated users to view submissions (admin access)
CREATE POLICY "Allow reading form submissions for authenticated users" 
ON public.form_submissions 
FOR SELECT 
TO authenticated 
USING (true);

-- Grant insert permission to anonymous users
GRANT INSERT ON public.form_submissions TO anon;
GRANT USAGE ON SCHEMA public TO anon;
