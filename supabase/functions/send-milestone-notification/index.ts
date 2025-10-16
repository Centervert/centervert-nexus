import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MilestoneNotification {
  to_email: string;
  to_name: string;
  ticket_number: number;
  ticket_title: string;
  ticket_id: string;
  milestone_title: string;
  milestone_type: string;
  milestone_status: string;
  actor_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: MilestoneNotification = await req.json();
    const origin = req.headers.get("origin") || "https://yourapp.com";
    const ticketUrl = `${origin}/tickets/${notification.ticket_id}`;

    const statusBadgeColor = notification.milestone_status === 'completed' ? '#10B981' : 
                             notification.milestone_status === 'pending' ? '#F59E0B' : '#6B7280';

    const emailResponse = await resend.emails.send({
      from: "Centervert <noreply@notifications.centervert.com>",
      to: [notification.to_email],
      subject: `Milestone Update: ${notification.milestone_title}`,
      html: `
        <h2>Milestone Update</h2>
        <p>Hi ${notification.to_name},</p>
        <p>${notification.actor_name} updated a milestone on ticket <strong>#${notification.ticket_number}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>${notification.milestone_title}</strong></p>
          <p style="margin: 8px 0; color: #666;">Type: ${notification.milestone_type}</p>
          <p style="margin: 0;">
            <span style="background-color: ${statusBadgeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${notification.milestone_status.toUpperCase()}
            </span>
          </p>
        </div>

        <p><strong>Related Ticket:</strong> ${notification.ticket_title}</p>

        <p><a href="${ticketUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a></p>
        
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Best regards,<br>The Centervert Team</p>
      `,
    });

    console.log("Milestone notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending milestone notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
