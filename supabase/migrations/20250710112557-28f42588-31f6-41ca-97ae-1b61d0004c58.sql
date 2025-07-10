-- Add approval status and workflow fields to offer_templates
ALTER TABLE public.offer_templates 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- Add template usage tracking table
CREATE TABLE public.template_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.offer_templates(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('viewed', 'selected', 'offer_created')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on template_usage_logs
ALTER TABLE public.template_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for template_usage_logs
CREATE POLICY "Staff can view all usage logs" 
ON public.template_usage_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'staff'
));

CREATE POLICY "Institutions can view their own usage logs" 
ON public.template_usage_logs 
FOR SELECT 
USING (auth.uid() = institution_id);

CREATE POLICY "Institutions can insert their own usage logs" 
ON public.template_usage_logs 
FOR INSERT 
WITH CHECK (auth.uid() = institution_id);

-- Update template policies to only allow approved templates for institutions
DROP POLICY IF EXISTS "Institutions can view offer templates" ON public.offer_templates;

CREATE POLICY "Institutions can view approved offer templates" 
ON public.offer_templates 
FOR SELECT 
USING (
  (approval_status = 'approved') AND 
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'institution'))
);

-- Add notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_template_updates BOOLEAN DEFAULT true,
  email_template_approvals BOOLEAN DEFAULT true,
  email_new_offers BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('template_approved', 'template_rejected', 'template_updated', 'offer_received')),
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_template_usage_logs_template_id ON public.template_usage_logs(template_id);
CREATE INDEX idx_template_usage_logs_institution_id ON public.template_usage_logs(institution_id);
CREATE INDEX idx_template_usage_logs_created_at ON public.template_usage_logs(created_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Add trigger for notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();