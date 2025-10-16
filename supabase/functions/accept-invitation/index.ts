import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  token: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { token, email, password, first_name, last_name, phone }: AcceptInvitationRequest = await req.json();

    // Validate invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("invitations")
      .select("*, clients(name)")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Invitation has expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Allow email to be updated from the invitation
    // The user can change their email during signup if needed

    // Create user account
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${first_name} ${last_name}`,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || "Failed to create user" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update profile with phone
    if (phone) {
      await supabaseClient
        .from("profiles")
        .update({ phone })
        .eq("id", authData.user.id);
    }

    // Assign role
    await supabaseClient
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: invitation.role,
      });

    // If client_id exists, create client_users mapping
    if (invitation.client_id) {
      await supabaseClient
        .from("client_users")
        .insert({
          user_id: authData.user.id,
          client_id: invitation.client_id,
        });

      // Update profile with client_id
      await supabaseClient
        .from("profiles")
        .update({ client_id: invitation.client_id })
        .eq("id", authData.user.id);
    }

    // Mark invitation as accepted
    await supabaseClient
      .from("invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    console.log("User invited successfully:", authData.user.email);

    return new Response(
      JSON.stringify({ 
        success: true,
        user: authData.user,
        client_name: invitation.clients?.name,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
