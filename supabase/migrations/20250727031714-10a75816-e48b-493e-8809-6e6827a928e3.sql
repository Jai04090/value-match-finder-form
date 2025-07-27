-- Create bulk_offers table to track bulk sending campaigns
CREATE TABLE public.bulk_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL,
  template_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  successful_sends INTEGER NOT NULL DEFAULT 0,
  failed_sends INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  targeting_filters JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add bulk_offer_id to institution_offers for grouping
ALTER TABLE public.institution_offers 
ADD COLUMN bulk_offer_id UUID REFERENCES public.bulk_offers(id);

-- Enable RLS on bulk_offers
ALTER TABLE public.bulk_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bulk_offers
CREATE POLICY "Institutions can view their own bulk offers" 
ON public.bulk_offers 
FOR SELECT 
USING (auth.uid() = institution_id);

CREATE POLICY "Institutions can create bulk offers" 
ON public.bulk_offers 
FOR INSERT 
WITH CHECK (auth.uid() = institution_id);

CREATE POLICY "Institutions can update their own bulk offers" 
ON public.bulk_offers 
FOR UPDATE 
USING (auth.uid() = institution_id);

-- Create trigger for automatic timestamp updates on bulk_offers
CREATE TRIGGER update_bulk_offers_updated_at
BEFORE UPDATE ON public.bulk_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_bulk_offers_institution_id ON public.bulk_offers(institution_id);
CREATE INDEX idx_bulk_offers_status ON public.bulk_offers(status);
CREATE INDEX idx_institution_offers_bulk_offer_id ON public.institution_offers(bulk_offer_id);