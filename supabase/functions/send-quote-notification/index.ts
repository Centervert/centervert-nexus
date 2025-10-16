import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteNotification {
  to_email: string;
  to_name: string;
  ticket_number: number;
  ticket_title: string;
  ticket_id: string;
  quote_amount: number;
  event_type: 'created' | 'approved' | 'declined' | 'expired';
  actor_name?: string;
  deliverables?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: QuoteNotification = await req.json();
    const origin = req.headers.get("origin") || "https://yourapp.com";
    const ticketUrl = `${origin}/tickets/${notification.ticket_id}`;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const eventTitles = {
      created: 'New Quote Available',
      approved: 'Quote Approved',
      declined: 'Quote Declined',
      expired: 'Quote Expired',
    };

    const eventMessages = {
      created: `A new quote has been created for ticket #${notification.ticket_number}.`,
      approved: `${notification.actor_name || 'The client'} approved the quote for ticket #${notification.ticket_number}.`,
      declined: `${notification.actor_name || 'The client'} declined the quote for ticket #${notification.ticket_number}.`,
      expired: `The quote for ticket #${notification.ticket_number} has expired.`,
    };

    const emailResponse = await resend.emails.send({
      from: "Centervert <onboarding@resend.dev>",
      to: [notification.to_email],
      subject: `${eventTitles[notification.event_type]}: ${notification.ticket_title}`,
      html: `
        <h2>${eventTitles[notification.event_type]}</h2>
        <p>Hi ${notification.to_name},</p>
        <p>${eventMessages[notification.event_type]}</p>
        
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Ticket #${notification.ticket_number}</strong></p>
          <p style="margin: 8px 0 0 0;">${notification.ticket_title}</p>
          <p style="margin: 12px 0 0 0; font-size: 24px; font-weight: bold; color: #4F46E5;">${formatCurrency(notification.quote_amount)}</p>
        </div>

        ${notification.deliverables && notification.deliverables.length > 0 ? `
          <p><strong>Deliverables:</strong></p>
          <ul style="color: #666;">
            ${notification.deliverables.map(d => `<li>${d}</li>`).join('')}
          </ul>
        ` : ''}

        <p><a href="${ticketUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Quote</a></p>
        
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Best regards,<br>The Centervert Team</p>
      `,
    });

    console.log("Quote notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending quote notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
