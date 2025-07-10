-- Create offer templates table for staff to create pre-approved offer types
CREATE TABLE public.offer_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  eligibility_criteria TEXT,
  reward_details TEXT,
  expiry_date DATE,
  offer_link TEXT,
  allowed_filters JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.offer_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for offer templates
CREATE POLICY "Staff can create offer templates" 
ON public.offer_templates 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff')
);

CREATE POLICY "Staff can view offer templates" 
ON public.offer_templates 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff')
);

CREATE POLICY "Staff can update their own templates" 
ON public.offer_templates 
FOR UPDATE 
USING (
  auth.uid() = created_by AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff')
);

CREATE POLICY "Staff can delete their own templates" 
ON public.offer_templates 
FOR DELETE 
USING (
  auth.uid() = created_by AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff')
);

CREATE POLICY "Institutions can view offer templates" 
ON public.offer_templates 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'institution')
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_offer_templates_updated_at
BEFORE UPDATE ON public.offer_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add template_id to institution_offers table to link offers to templates
ALTER TABLE public.institution_offers 
ADD COLUMN template_id UUID REFERENCES public.offer_templates(id);

-- Add index for better performance
CREATE INDEX idx_offer_templates_type ON public.offer_templates(type);
CREATE INDEX idx_offer_templates_created_by ON public.offer_templates(created_by);