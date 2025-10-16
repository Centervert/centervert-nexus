import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const DeletedClients = () => {
  const queryClient = useQueryClient();
  const [restoreClientId, setRestoreClientId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);

  const { data: deletedClients, isLoading } = useQuery({
    queryKey: ['deleted-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.rpc('restore_client', {
        client_id_param: clientId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Client restored successfully', {
        description: 'All associated users have been reactivated.',
      });
      queryClient.invalidateQueries({ queryKey: ['deleted-clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setRestoreClientId(null);
    },
    onError: (error: any) => {
      console.error('Restore error:', error);
      toast.error('Failed to restore client');
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Client permanently deleted');
      queryClient.invalidateQueries({ queryKey: ['deleted-clients'] });
      setPermanentDeleteId(null);
    },
    onError: (error: any) => {
      console.error('Permanent delete error:', error);
      toast.error('Failed to permanently delete client');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deleted Clients</CardTitle>
          <CardDescription>Restore or permanently delete clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Deleted Clients</CardTitle>
          <CardDescription>Restore or permanently delete clients</CardDescription>
        </CardHeader>
        <CardContent>
          {!deletedClients || deletedClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deleted clients
            </div>
          ) : (
            <div className="space-y-3">
              {deletedClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Deleted {new Date(client.deleted_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="secondary">{client.client_type.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreClientId(client.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setPermanentDeleteId(client.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Forever
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreClientId} onOpenChange={() => setRestoreClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the client and reactivate all associated users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (restoreClientId) restoreMutation.mutate(restoreClientId);
              }}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={!!permanentDeleteId} onOpenChange={() => setPermanentDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client and
              all associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={permanentDeleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (permanentDeleteId) permanentDeleteMutation.mutate(permanentDeleteId);
              }}
              disabled={permanentDeleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {permanentDeleteMutation.isPending ? 'Deleting...' : 'Delete Forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
