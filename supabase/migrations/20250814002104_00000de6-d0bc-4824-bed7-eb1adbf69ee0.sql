-- Remove dangerous public read policies on form_submissions table
-- This fixes the security vulnerability where sensitive personal data was publicly accessible

-- Drop the overly permissive policies that allow public/unrestricted access
DROP POLICY IF EXISTS "Allow reading form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "enable_select_for_authenticated_users" ON public.form_submissions;
DROP POLICY IF EXISTS "Allow reading form submissions for authenticated users" ON public.form_submissions;

-- Keep the secure policies that restrict access to:
-- 1. Users can only view their own submissions
-- 2. Users can create their own submissions (when authenticated)
-- 3. Anonymous users can still submit forms (necessary for signup flow)

-- The remaining policies are secure:
-- - "Users can view their own submissions" (auth.uid() = user_id)
-- - "Users can create their own submissions" (auth.uid() = user_id) 
-- - "Users can update their own submissions" (auth.uid() = user_id)
-- - "Users can delete their own submissions" (auth.uid() = user_id)
-- - Anonymous insertion policies for the signup flow