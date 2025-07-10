import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'template_approved' | 'template_rejected' | 'template_updated' | 'offer_received';
  userId: string;
  title: string;
  message: string;
  metadata?: any;
  sendEmail?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, userId, title, message, metadata = {}, sendEmail = false }: NotificationRequest = await req.json();

    console.log('Processing notification:', { type, userId, title, sendEmail });

    // Create in-app notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    console.log('Notification created:', notification.id);

    // Check user's notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (preferencesError) {
      console.error('Error fetching notification preferences:', preferencesError);
      // Continue without email if preferences can't be fetched
    }

    // Get user email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // Send email if enabled and user has email preferences set
    const shouldSendEmail = sendEmail && 
      preferences && 
      (
        (type === 'template_approved' && preferences.email_template_approvals) ||
        (type === 'template_rejected' && preferences.email_template_approvals) ||
        (type === 'template_updated' && preferences.email_template_updates) ||
        (type === 'offer_received' && preferences.email_new_offers)
      );

    if (shouldSendEmail && profile.email) {
      console.log('Sending email notification to:', profile.email);
      
      // Here you would integrate with your email service (e.g., Resend)
      // For now, we'll just log it
      console.log('Email would be sent:', {
        to: profile.email,
        subject: title,
        content: message,
        type
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationId: notification.id,
        emailSent: shouldSendEmail 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});