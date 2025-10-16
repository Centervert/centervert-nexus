import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { sendUserInvite } from '@/lib/emailNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const InviteUserDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('user');
  const [clientId, setClientId] = useState('');

  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
  });

  const { data: inviterProfile } = useQuery({
    queryKey: ['inviter-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const selectedClient = clients?.find(c => c.id === clientId);
      const inviterName = inviterProfile?.full_name || user?.email || 'Admin';
      
      // Generate unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          email,
          client_id: role === 'user' && clientId ? clientId : null,
          role: role as 'user' | 'agent' | 'admin',
          token,
          invited_by: user?.id,
          expires_at: expiresAt.toISOString(),
        }]);

      if (inviteError) throw inviteError;

      // Send invitation email
      await sendUserInvite({
        email,
        inviter_name: inviterName,
        role,
        client_name: selectedClient?.name,
        token,
      });
    },
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      setOpen(false);
      setEmail('');
      setRole('user');
      setClientId('');
    },
    onError: (error) => {
      console.error('Invitation error:', error);
      toast.error('Failed to send invitation');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation email to a new user
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === 'user' && (
            <div>
              <Label htmlFor="client">
                Client <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={() => inviteMutation.mutate()}
            disabled={!email || inviteMutation.isPending}
            className="w-full"
          >
            {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
