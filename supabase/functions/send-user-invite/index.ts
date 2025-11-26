import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import React from 'https://esm.sh/react@18.3.1';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import { InviteEmail } from './_templates/invite-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  inviter_name: string;
  role: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviter_name, role, token }: InviteRequest = await req.json();

    // Use custom domain for invitation links
    const inviteUrl = `https://portal.centervert.com/auth?invite=${token}`;

    // Render the React Email template
    const html = await renderAsync(
      React.createElement(InviteEmail, {
        inviterName: inviter_name,
        recipientEmail: email,
        role: role,
        inviteUrl: inviteUrl,
        expiryDays: 7,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Centervert <noreply@notifications.centervert.com>",
      to: [email],
      subject: "You've been invited to join Centervert",
      html,
    });

    console.log("User invite sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending user invite:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
