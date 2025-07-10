import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled offer publishing check...');

    // Find templates that are scheduled to be published and haven't been published yet
    const { data: scheduledTemplates, error: fetchError } = await supabase
      .from('offer_templates')
      .select('id, name, publish_at')
      .eq('is_published', false)
      .not('publish_at', 'is', null)
      .lte('publish_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching scheduled templates:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledTemplates?.length || 0} templates ready for publication`);

    if (!scheduledTemplates || scheduledTemplates.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No scheduled templates ready for publication',
        published: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const publishedTemplates = [];
    const errors = [];

    // Process each template
    for (const template of scheduledTemplates) {
      try {
        console.log(`Publishing template: ${template.name} (ID: ${template.id})`);

        // Update the template to published status
        const { error: updateError } = await supabase
          .from('offer_templates')
          .update({ 
            is_published: true,
            publish_at: null // Clear the scheduled time since it's now published
          })
          .eq('id', template.id);

        if (updateError) {
          console.error(`Error updating template ${template.id}:`, updateError);
          errors.push({ templateId: template.id, error: updateError.message });
          continue;
        }

        // Log the publication event
        const { error: logError } = await supabase
          .from('template_publishing_logs')
          .insert({
            template_id: template.id,
            action: 'published',
            scheduled_for: template.publish_at,
            published_at: new Date().toISOString(),
            metadata: { 
              automated: true,
              publication_trigger: 'scheduled_cron'
            }
          });

        if (logError) {
          console.warn(`Warning: Failed to log publication for template ${template.id}:`, logError);
          // Don't fail the entire operation for logging errors
        }

        publishedTemplates.push({
          id: template.id,
          name: template.name,
          scheduledFor: template.publish_at
        });

        console.log(`Successfully published template: ${template.name}`);

      } catch (err) {
        console.error(`Error processing template ${template.id}:`, err);
        errors.push({ 
          templateId: template.id, 
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    const response = {
      message: `Publishing complete. ${publishedTemplates.length} templates published.`,
      published: publishedTemplates.length,
      publishedTemplates,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Publication summary:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in publish-scheduled-offers function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        published: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);