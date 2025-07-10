-- Add role column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'institution', 'admin'));

-- Add additional profile columns needed for the dashboard
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS is_student boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS green_banking_interest boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dei_preference boolean DEFAULT false;

-- Create institution_offers table
CREATE TABLE IF NOT EXISTS public.institution_offers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    institution_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    expiry_date date,
    referral_bonus integer,
    offer_link text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on institution_offers table
ALTER TABLE public.institution_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for institution_offers
CREATE POLICY "Institutions can view their own offers" 
ON public.institution_offers 
FOR SELECT 
USING (auth.uid() = institution_id);

CREATE POLICY "Institutions can create offers" 
ON public.institution_offers 
FOR INSERT 
WITH CHECK (auth.uid() = institution_id);

CREATE POLICY "Institutions can update their own offers" 
ON public.institution_offers 
FOR UPDATE 
USING (auth.uid() = institution_id);

CREATE POLICY "Institutions can delete their own offers" 
ON public.institution_offers 
FOR DELETE 
USING (auth.uid() = institution_id);

-- Users can view offers sent to them
CREATE POLICY "Users can view offers sent to them" 
ON public.institution_offers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institution_offers_updated_at
    BEFORE UPDATE ON public.institution_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles RLS to allow institutions to view users
CREATE POLICY "Institutions can view user profiles" 
ON public.profiles 
FOR SELECT 
USING (
    CASE 
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'institution' 
        THEN role = 'user'
        ELSE auth.uid() = id
    END
);