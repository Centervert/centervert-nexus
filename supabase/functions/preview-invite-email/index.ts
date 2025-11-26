import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import React from 'https://esm.sh/react@18.3.1';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import { InviteEmail } from '../send-user-invite/_templates/invite-email.tsx';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreviewRequest {
  email?: string;
  inviter_name?: string;
  role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})) as PreviewRequest;
    
    // Use sample data or provided data
    const email = body.email || "preview@example.com";
    const inviterName = body.inviter_name || "John Smith";
    const role = body.role || "admin";
    const sampleToken = "preview-token-123";
    const inviteUrl = `https://portal.centervert.com/auth?invite=${sampleToken}`;

    // Render the React Email template
    const html = await renderAsync(
      React.createElement(InviteEmail, {
        inviterName: inviterName,
        recipientEmail: email,
        role: role,
        inviteUrl: inviteUrl,
        expiryDays: 7,
      })
    );

    console.log("Email preview generated successfully");

    return new Response(html, {
      status: 200,
      headers: { 
        "Content-Type": "text/html",
        ...corsHeaders 
      },
    });
  } catch (error: any) {
    console.error("Error generating email preview:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
