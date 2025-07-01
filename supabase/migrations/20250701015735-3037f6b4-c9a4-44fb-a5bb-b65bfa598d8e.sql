
-- Ensure RLS is enabled and create proper policies for form_submissions
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON public.form_submissions;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own submissions" 
  ON public.form_submissions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" 
  ON public.form_submissions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
  ON public.form_submissions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions" 
  ON public.form_submissions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Ensure RLS is also properly set up for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create a helper function to get user profile with preferences
CREATE OR REPLACE FUNCTION public.get_user_profile_with_preferences(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  updated_at timestamptz,
  has_preferences boolean,
  preferences_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.created_at,
    p.updated_at,
    CASE WHEN fs.user_id IS NOT NULL THEN true ELSE false END as has_preferences,
    COUNT(fs.id) as preferences_count
  FROM public.profiles p
  LEFT JOIN public.form_submissions fs ON p.id = fs.user_id
  WHERE p.id = user_uuid
  GROUP BY p.id, p.email, p.created_at, p.updated_at, fs.user_id;
$$;
