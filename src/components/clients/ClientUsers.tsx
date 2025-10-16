import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';

interface ClientUsersProps {
  clientId: string;
}

export const ClientUsers = ({ clientId }: ClientUsersProps) => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['client-users', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_users')
        .select(`
          *,
          profile:profiles(full_name, email)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portal Users</CardTitle>
          <InviteUserDialog 
            preSelectedClientId={clientId}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading users...</p>
        ) : users && users.length > 0 ? (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">{user.profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.profile?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{user.access_level}</Badge>
                    {user.can_create_tickets && <Badge variant="secondary">Can Create Tickets</Badge>}
                    {user.can_approve_quotes && <Badge variant="secondary">Can Approve Quotes</Badge>}
                    {user.can_view_invoices && <Badge variant="secondary">Can View Invoices</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No users yet</p>
        )}
      </CardContent>
    </Card>
  );
};
