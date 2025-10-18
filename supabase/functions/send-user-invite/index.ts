import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  inviter_name: string;
  role: string;
  client_name?: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviter_name, role, client_name, token }: InviteRequest = await req.json();

    // Use custom domain for invitation links
    const inviteUrl = `https://portal.centervert.com/auth?invite=${token}`;

    const emailResponse = await resend.emails.send({
      from: "Centervert <noreply@notifications.centervert.com>",
      to: [email],
      subject: "You've been invited to Centervert",
      html: `
        <h1>Welcome to Centervert!</h1>
        <p>${inviter_name} has invited you to join as a <strong>${role}</strong>${client_name ? ` for ${client_name}` : ''}.</p>
        <p>You've been invited to track your projects with Centervert like a pro. Accept today.</p>
        <p>Please click the link below to set up your account:</p>
        <p><a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
      `,
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
