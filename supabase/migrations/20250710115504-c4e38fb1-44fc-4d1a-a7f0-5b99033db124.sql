-- Add scheduling and publishing fields to offer_templates table
ALTER TABLE public.offer_templates 
ADD COLUMN publish_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_published BOOLEAN DEFAULT FALSE;

-- Update existing approved templates to be published
UPDATE public.offer_templates 
SET is_published = true 
WHERE approval_status = 'approved';

-- Create index for better performance on scheduled publishing queries
CREATE INDEX idx_offer_templates_publish_schedule ON public.offer_templates(publish_at, is_published) 
WHERE publish_at IS NOT NULL AND is_published = false;

-- Create audit table for tracking publishing events
CREATE TABLE public.template_publishing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.offer_templates(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'scheduled', 'published', 'cancelled', 'updated'
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  staff_user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on publishing logs
ALTER TABLE public.template_publishing_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for publishing logs
CREATE POLICY "Staff can view all publishing logs" 
ON public.template_publishing_logs 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff')
);

CREATE POLICY "Staff can insert publishing logs" 
ON public.template_publishing_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff')
);

-- Add index for publishing logs
CREATE INDEX idx_template_publishing_logs_template_id ON public.template_publishing_logs(template_id);
CREATE INDEX idx_template_publishing_logs_created_at ON public.template_publishing_logs(created_at DESC);