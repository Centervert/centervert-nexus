import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users from auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    console.log(`Found ${users?.length || 0} users to delete`);

    // Delete each user
    const deletionResults = [];
    for (const user of users || []) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Failed to delete user ${user.email}:`, deleteError);
          deletionResults.push({ email: user.email, success: false, error: deleteError.message });
        } else {
          console.log(`Successfully deleted user: ${user.email}`);
          deletionResults.push({ email: user.email, success: true });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Exception deleting user ${user.email}:`, err);
        deletionResults.push({ email: user.email, success: false, error: errorMessage });
      }
    }

    const successCount = deletionResults.filter(r => r.success).length;
    const failCount = deletionResults.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Cleanup complete: ${successCount} deleted, ${failCount} failed`,
        results: deletionResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Cleanup function error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
