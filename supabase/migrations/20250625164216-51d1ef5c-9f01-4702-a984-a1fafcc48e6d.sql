
-- Create submissions table to store form data
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_financial_institution TEXT,
  looking_for TEXT,
  religious_organization TEXT,
  sharia_compliant BOOLEAN DEFAULT false,
  current_employer TEXT,
  student_or_alumni TEXT,
  current_or_former_military TEXT,
  military_branch TEXT,
  environmental_initiatives BOOLEAN DEFAULT false,
  diversity_equity_inclusion BOOLEAN DEFAULT false,
  religion TEXT,
  submission_ip TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (since this is a public form)
CREATE POLICY "Allow public form submissions" 
  ON public.form_submissions 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Create policy to allow reading submissions (for future admin features)
CREATE POLICY "Allow reading form submissions" 
  ON public.form_submissions 
  FOR SELECT 
  TO authenticated 
  USING (true);
