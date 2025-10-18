import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketNotification {
  to_email: string;
  to_name: string;
  ticket_number: number;
  ticket_title: string;
  ticket_id: string;
  event_type: 'created' | 'updated' | 'assigned' | 'status_changed' | 'comment_added';
  actor_name: string;
  details?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: TicketNotification = await req.json();
    const origin = req.headers.get("origin") || "https://yourapp.com";
    const ticketUrl = `${origin}/tickets/${notification.ticket_id}`;

    const eventMessages = {
      created: `${notification.actor_name} created a new ticket`,
      updated: `${notification.actor_name} updated the ticket`,
      assigned: `${notification.actor_name} assigned the ticket to you`,
      status_changed: `Ticket status was changed`,
      comment_added: `${notification.actor_name} added a comment`,
    };

    const emailResponse = await resend.emails.send({
      from: "Centervert <noreply@notifications.centervert.com>",
      to: [notification.to_email],
      subject: `Ticket #${notification.ticket_number}: ${notification.ticket_title}`,
      html: `
        <h2>Ticket Update</h2>
        <p>Hi ${notification.to_name},</p>
        <p><strong>${eventMessages[notification.event_type]}</strong></p>
        
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Ticket #${notification.ticket_number}</strong></p>
          <p style="margin: 8px 0 0 0;">${notification.ticket_title}</p>
          ${notification.details ? `<p style="margin: 8px 0 0 0; color: #666;">${notification.details}</p>` : ''}
        </div>

        <p><a href="${ticketUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a></p>
        
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Best regards,<br>The Centervert Team</p>
      `,
    });

    console.log("Ticket notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending ticket notification:", error);
    return new Response(JSON.stringify({ error: "Failed to send notification. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
