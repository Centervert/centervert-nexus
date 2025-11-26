import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreviewRequest {
  email?: string;
  inviter_name?: string;
  role?: string;
}

function generateEmailHTML(inviterName: string, role: string, inviteUrl: string): string {
  const roleDisplay = role === 'admin' ? 'Admin' : 'Team Member';
  const roleDescription = role === 'admin' 
    ? 'full system access to manage companies, contacts, billing, and team members'
    : 'access to manage companies and contacts';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; max-width: 600px;">
                <!-- Logo Section -->
                <tr>
                  <td style="background-color: #9c5126; padding: 32px 40px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0;">CENTERVERT</h1>
                  </td>
                </tr>
                
                <!-- Content Section -->
                <tr>
                  <td style="padding: 0 40px;">
                    <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 40px 0 20px; padding: 0; line-height: 1.25;">You are Invited!</h1>
                    
                    <p style="color: #484848; font-size: 16px; font-weight: 500; line-height: 1.5; margin: 16px 0;">
                      ${inviterName} has invited you to join Centervert as a ${roleDisplay}.
                    </p>

                    <p style="color: #484848; font-size: 16px; font-weight: 500; line-height: 1.5; margin: 16px 0;">
                      As a ${roleDisplay}, you will have ${roleDescription}.
                    </p>

                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${inviteUrl}" style="background-color: #9c5126; border-radius: 8px; color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 14px 32px; line-height: 1.5;">Accept Invitation</a>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #484848; font-size: 14px; line-height: 1.5; margin: 24px 0 8px;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="color: #9c5126; font-size: 14px; text-decoration: underline; word-break: break-all; margin: 8px 0;">
                      ${inviteUrl}
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;">
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 0 40px; text-align: center;">
                    <p style="color: #8898aa; font-size: 14px; line-height: 1.5; margin: 8px 0;">
                      This invitation expires in 7 days.
                    </p>
                    <p style="color: #8898aa; font-size: 14px; line-height: 1.5; margin: 8px 0;">
                      If you did not expect this invitation, you can safely ignore this email.
                    </p>
                    <p style="color: #8898aa; font-size: 12px; line-height: 1.5; margin: 16px 0 0;">
                      &copy; ${new Date().getFullYear()} Centervert. All rights reserved.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="height: 48px;"></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})) as PreviewRequest;
    
    // Use sample data or provided data
    const inviterName = body.inviter_name || "John Smith";
    const role = body.role || "admin";
    const sampleToken = "preview-token-123";
    const inviteUrl = `https://portal.centervert.com/auth?invite=${sampleToken}`;

    // Generate HTML email
    const html = generateEmailHTML(inviterName, role, inviteUrl);

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
