import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, Plus, Mail, Phone, Trash2, UserCheck } from 'lucide-react';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';

interface UnifiedClientViewProps {
  client: any;
}

export const UnifiedClientView = ({ client }: UnifiedClientViewProps) => {
  const { toast } = useToast();
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

  // Check if a contact email matches a portal user
  const isPortalUser = (email: string) => {
    return portalUsers?.some(user => user.profile?.email === email);
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
              <CardTitle>Contacts & Portal Users</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage client contacts and invite them to the portal
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddContactDialog(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
              <InviteUserDialog 
                preSelectedClientId={client.id}
                trigger={
                  <Button>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Invite to Portal
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contactsLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading contacts...</p>
          ) : contacts && contacts.length > 0 ? (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contact.full_name}</p>
                      {isPortalUser(contact.email) && (
                        <Badge variant="default" className="gap-1">
                          <UserCheck className="h-3 w-3" />
                          Portal User
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
              ))}
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
