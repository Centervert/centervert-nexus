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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

export const DeleteClientDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess,
}: DeleteClientDialogProps) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('soft_delete_client', {
        client_id_param: clientId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Client deleted successfully', {
        description: 'All associated users have been deactivated.',
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete client');
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will delete <strong>{clientName}</strong> and deactivate all
              associated users. You can restore this client later from the Deleted
              Clients section.
            </p>
            <p className="text-sm text-muted-foreground">
              This action is reversible.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Client'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
