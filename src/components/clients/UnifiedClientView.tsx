import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, Plus, Mail, Phone, Trash2, UserCheck, Send, Clock, AlertCircle, RotateCw, KeyRound } from 'lucide-react';
import { sendUserInvite } from '@/lib/emailNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface UnifiedClientViewProps {
  client: any;
}

export const UnifiedClientView = ({ client }: UnifiedClientViewProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  
  const [clientFormData, setClientFormData] = useState({
    name: client.name,
    payment_terms: client.payment_terms || '',
    payment_terms_days: client.payment_terms_days || '',
    billing_address: client.billing_address || '',
    tax_id: client.tax_id || '',
    website: client.website || '',
    phone: client.phone || '',
    notes: client.notes || '',
    is_active: client.is_active,
    managing_agency_id: client.managing_agency_id || '',
  });

  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    title: '',
    is_primary: false,
    is_billing: false,
    is_technical: false,
  });

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['client-contacts', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch agencies for dropdown
  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('client_type', 'agency')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch portal users
  const { data: portalUsers } = useQuery({
    queryKey: ['client-users', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_users')
        .select(`
          *,
          profile:profiles(full_name, email, phone)
        `)
        .eq('client_id', client.id);
      if (error) throw error;
      return data;
    },
  });

  // Fetch invitations for all contacts
  const { data: invitations } = useQuery({
    queryKey: ['client-invitations', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch inviter profile
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

  const updateClientMutation = useMutation({
    mutationFn: async (data: typeof clientFormData) => {
      const { error } = await supabase
        .from('clients')
        .update({
          name: data.name,
          payment_terms: data.payment_terms || null,
          payment_terms_days: data.payment_terms_days ? parseInt(data.payment_terms_days.toString()) : null,
          billing_address: data.billing_address || null,
          tax_id: data.tax_id || null,
          website: data.website || null,
          phone: data.phone || null,
          notes: data.notes || null,
          is_active: data.is_active,
          managing_agency_id: data.managing_agency_id || null,
        })
        .eq('id', client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', client.id] });
      toast({ title: 'Success', description: 'Client updated successfully' });
      setIsEditingClient(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: typeof contactFormData) => {
      const { error } = await supabase.from('client_contacts').insert({
        client_id: client.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', client.id] });
      toast({ title: 'Success', description: 'Contact added successfully' });
      setShowAddContactDialog(false);
      setContactFormData({
        full_name: '',
        email: '',
        phone: '',
        title: '',
        is_primary: false,
        is_billing: false,
        is_technical: false,
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase.from('client_contacts').delete().eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', client.id] });
      toast({ title: 'Success', description: 'Contact deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const inviteContactMutation = useMutation({
    mutationFn: async ({ email, fullName }: { email: string; fullName: string }) => {
      const inviterName = inviterProfile?.full_name || user?.email || 'Admin';
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          email,
          client_id: client.id,
          role: 'user',
          token,
          invited_by: user?.id,
          expires_at: expiresAt.toISOString(),
        }]);

      if (inviteError) throw inviteError;

      await sendUserInvite({
        email,
        inviter_name: inviterName,
        role: 'user',
        client_name: client.name,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-invitations', client.id] });
      toast({ title: 'Success', description: 'Invitation sent successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async ({ email, fullName, oldToken }: { email: string; fullName: string; oldToken: string }) => {
      const inviterName = inviterProfile?.full_name || user?.email || 'Admin';
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Update existing invitation
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .eq('token', oldToken);

      if (updateError) throw updateError;

      await sendUserInvite({
        email,
        inviter_name: inviterName,
        role: 'user',
        client_name: client.name,
        token: newToken,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-invitations', client.id] });
      toast({ title: 'Success', description: 'Invitation resent successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Password reset link sent' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Get contact status and invitation details
  const getContactStatus = (email: string) => {
    const portalUser = portalUsers?.find(user => user.profile?.email === email);
    if (portalUser) {
      return { type: 'portal_user' as const, data: portalUser };
    }

    const contactInvites = invitations?.filter(inv => inv.email === email) || [];
    const pendingInvite = contactInvites.find(inv => 
      inv.status === 'pending' && new Date(inv.expires_at) > new Date()
    );
    
    if (pendingInvite) {
      return { type: 'invited' as const, data: pendingInvite };
    }

    const expiredInvite = contactInvites.find(inv => 
      inv.status === 'pending' && new Date(inv.expires_at) <= new Date()
    );
    
    if (expiredInvite) {
      return { type: 'expired' as const, data: expiredInvite };
    }

    return { type: 'contact_only' as const, data: null };
  };

  return (
    <div className="space-y-6">
      {/* Client Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client Information</CardTitle>
            {!isEditingClient ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingClient(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingClient(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={() => updateClientMutation.mutate(clientFormData)} disabled={updateClientMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              {isEditingClient ? (
                <Input
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium">{client.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Client Type</Label>
              <div>
                <Badge>{client.client_type.replace('_', ' ')}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div>
                <Badge variant={clientFormData.is_active ? 'default' : 'secondary'}>
                  {clientFormData.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {(client.client_type === 'agency_managed' || isEditingClient) && (
            <div className="space-y-2">
              <Label>Managing Agency</Label>
              {isEditingClient ? (
                <Select
                  value={clientFormData.managing_agency_id}
                  onValueChange={(value) => setClientFormData({ ...clientFormData, managing_agency_id: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select agency (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="">None</SelectItem>
                    {agencies?.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">
                  {client.managing_agency?.name || '-'}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              {isEditingClient ? (
                <Input
                  value={clientFormData.payment_terms}
                  onChange={(e) => setClientFormData({ ...clientFormData, payment_terms: e.target.value })}
                  placeholder="e.g., Net 30"
                />
              ) : (
                <p className="text-sm">{client.payment_terms || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Days</Label>
              {isEditingClient ? (
                <Input
                  type="number"
                  value={clientFormData.payment_terms_days}
                  onChange={(e) => setClientFormData({ ...clientFormData, payment_terms_days: e.target.value })}
                  placeholder="e.g., 30"
                />
              ) : (
                <p className="text-sm">{client.payment_terms_days || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              {isEditingClient ? (
                <Input
                  type="tel"
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                />
              ) : (
                <p className="text-sm">{client.phone || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              {isEditingClient ? (
                <Input
                  type="url"
                  value={clientFormData.website}
                  onChange={(e) => setClientFormData({ ...clientFormData, website: e.target.value })}
                />
              ) : (
                <p className="text-sm">
                  {client.website ? (
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {client.website}
                    </a>
                  ) : (
                    '-'
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Tax ID / EIN</Label>
              {isEditingClient ? (
                <Input
                  value={clientFormData.tax_id}
                  onChange={(e) => setClientFormData({ ...clientFormData, tax_id: e.target.value })}
                />
              ) : (
                <p className="text-sm">{client.tax_id || '-'}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Billing Address</Label>
            {isEditingClient ? (
              <Textarea
                value={clientFormData.billing_address}
                onChange={(e) => setClientFormData({ ...clientFormData, billing_address: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{client.billing_address || '-'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            {isEditingClient ? (
              <Textarea
                value={clientFormData.notes}
                onChange={(e) => setClientFormData({ ...clientFormData, notes: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{client.notes || '-'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts & Portal Users Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contacts</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage client contacts and their portal access
              </p>
            </div>
            <Button onClick={() => setShowAddContactDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contactsLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading contacts...</p>
          ) : contacts && contacts.length > 0 ? (
            <div className="space-y-4">
              {contacts.map((contact) => {
                const status = getContactStatus(contact.email);
                return (
                  <div key={contact.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{contact.full_name}</p>
                        {status.type === 'portal_user' && (
                          <Badge variant="default" className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            Portal User
                          </Badge>
                        )}
                        {status.type === 'invited' && (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Invite Sent
                          </Badge>
                        )}
                        {status.type === 'expired' && (
                          <Badge variant="outline" className="gap-1 border-destructive text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            Invite Expired
                          </Badge>
                        )}
                      </div>
                      {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
                      <div className="flex flex-wrap gap-2">
                        {contact.is_primary && <Badge variant="secondary">Primary</Badge>}
                        {contact.is_billing && <Badge variant="outline">Billing</Badge>}
                        {contact.is_technical && <Badge variant="outline">Technical</Badge>}
                      </div>
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {status.type === 'contact_only' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => inviteContactMutation.mutate({ 
                              email: contact.email, 
                              fullName: contact.full_name 
                            })}
                            disabled={inviteContactMutation.isPending}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Invite to Portal
                          </Button>
                        )}
                        {status.type === 'invited' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendInviteMutation.mutate({ 
                              email: contact.email, 
                              fullName: contact.full_name,
                              oldToken: status.data.token
                            })}
                            disabled={resendInviteMutation.isPending}
                          >
                            <RotateCw className="h-3 w-3 mr-1" />
                            Resend Invite
                          </Button>
                        )}
                        {status.type === 'expired' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendInviteMutation.mutate({ 
                              email: contact.email, 
                              fullName: contact.full_name,
                              oldToken: status.data.token
                            })}
                            disabled={resendInviteMutation.isPending}
                          >
                            <RotateCw className="h-3 w-3 mr-1" />
                            Resend Invite
                          </Button>
                        )}
                        {status.type === 'portal_user' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendPasswordResetMutation.mutate(contact.email)}
                            disabled={sendPasswordResetMutation.isPending}
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            Send Password Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteContactMutation.mutate(contact.id)}
                      disabled={deleteContactMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No contacts yet</p>
              <Button onClick={() => setShowAddContactDialog(true)} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Contact
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addContactMutation.mutate(contactFormData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={contactFormData.full_name}
                onChange={(e) => setContactFormData({ ...contactFormData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={contactFormData.email}
                onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={contactFormData.phone}
                onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={contactFormData.title}
                onChange={(e) => setContactFormData({ ...contactFormData, title: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddContactDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addContactMutation.isPending}>
                Add Contact
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
