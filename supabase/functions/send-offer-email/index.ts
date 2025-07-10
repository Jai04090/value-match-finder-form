import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOfferEmailRequest {
  offerId: string;
  userEmail: string;
  userName: string;
  institutionName: string;
  offerTitle: string;
  offerDescription: string;
  offerLink?: string;
  referralBonus?: number;
  expiryDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send offer email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      offerId, 
      userEmail, 
      userName, 
      institutionName, 
      offerTitle, 
      offerDescription, 
      offerLink, 
      referralBonus, 
      expiryDate 
    }: SendOfferEmailRequest = await req.json();

    console.log("Sending offer email to:", userEmail);

    // Build email content
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Offer from ${institutionName}
        </h1>
        
        <p style="font-size: 16px; color: #666;">
          Hello ${userName || 'Valued Customer'},
        </p>
        
        <p style="font-size: 16px; color: #666;">
          We're excited to share a personalized financial offer with you!
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #007bff; margin-top: 0;">${offerTitle}</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            ${offerDescription}
          </p>
          
          ${referralBonus ? `
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <strong style="color: #155724;">💰 Referral Bonus: $${referralBonus}</strong>
            </div>
          ` : ''}
          
          <p style="color: #666; margin-bottom: 0;">
            <strong>Offer expires:</strong> ${new Date(expiryDate).toLocaleDateString()}
          </p>
        </div>
        
        ${offerLink ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${offerLink}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Full Offer Details
            </a>
          </div>
        ` : ''}
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
          <p>Best regards,<br>The ${institutionName} Team</p>
          <p style="font-size: 12px; color: #999;">
            This offer was sent to you based on your preferences in our Value Match Finder system. 
            If you no longer wish to receive these offers, please contact us.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: `${institutionName} <onboarding@resend.dev>`,
      to: [userEmail],
      subject: `New Financial Offer: ${offerTitle}`,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: "Offer email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-offer-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);