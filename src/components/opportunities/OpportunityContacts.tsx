import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Phone, Trash2 } from 'lucide-react';
import { useOpportunityContacts, useLinkContact, useUnlinkContact, useContacts } from '@/hooks/useContacts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import CreateContactDialog from '@/components/contacts/CreateContactDialog';

interface OpportunityContactsProps {
  opportunityId: string;
}

const OpportunityContacts = ({ opportunityId }: OpportunityContactsProps) => {
  const { data: opportunityContacts, isLoading } = useOpportunityContacts(opportunityId);
  const { data: allContacts } = useContacts();
  const linkContact = useLinkContact();
  const unlinkContact = useUnlinkContact();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [relationshipType, setRelationshipType] = useState('primary');

  const availableContacts = allContacts?.filter(
    contact => !opportunityContacts?.some(oc => oc.contact_id === contact.id)
  );

  const handleLinkContact = () => {
    if (!selectedContactId) return;

    linkContact.mutate(
      {
        opportunity_id: opportunityId,
        contact_id: selectedContactId,
        relationship_type: relationshipType,
      },
      {
        onSuccess: () => {
          setLinkDialogOpen(false);
          setSelectedContactId('');
          setRelationshipType('primary');
        },
      }
    );
  };

  const handleUnlink = (contactId: string) => {
    unlinkContact.mutate({
      opportunity_id: opportunityId,
      contact_id: contactId,
    });
  };

  const getRelationshipBadge = (type: string | null) => {
    const colors: Record<string, string> = {
      primary: 'bg-blue-500',
      decision_maker: 'bg-purple-500',
      influencer: 'bg-green-500',
      technical: 'bg-orange-500',
    };
    return colors[type || 'primary'] || 'bg-gray-500';
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Contacts</h3>
          <p className="text-sm text-muted-foreground">People associated with this opportunity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Button>
          <Button onClick={() => setLinkDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Link Existing
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading contacts...</p>
        ) : opportunityContacts?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No contacts linked yet</p>
        ) : (
          opportunityContacts?.map((oc) => (
            <div key={oc.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{oc.contact.full_name}</h4>
                    {oc.relationship_type && (
                      <Badge className={getRelationshipBadge(oc.relationship_type)}>
                        {oc.relationship_type.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  {oc.contact.title && <p className="text-sm text-muted-foreground">{oc.contact.title}</p>}
                  {oc.contact.organization && (
                    <p className="text-sm text-muted-foreground">{oc.contact.organization}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUnlink(oc.contact_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-4 text-sm">
                {oc.contact.email && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <a href={`mailto:${oc.contact.email}`} className="hover:underline">
                      {oc.contact.email}
                    </a>
                  </div>
                )}
                {oc.contact.phone && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <a href={`tel:${oc.contact.phone}`} className="hover:underline">
                      {oc.contact.phone}
                    </a>
                    {oc.contact.phone_extension && (
                      <span className="text-xs">ext. {oc.contact.phone_extension}</span>
                    )}
                  </div>
                )}
              </div>

              {oc.notes && <p className="text-sm text-muted-foreground mt-2">{oc.notes}</p>}
            </div>
          ))
        )}
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Existing Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Contact</Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a contact" />
                </SelectTrigger>
                <SelectContent>
                  {availableContacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.full_name} {contact.organization && `(${contact.organization})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Relationship Type</Label>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary Contact</SelectItem>
                  <SelectItem value="decision_maker">Decision Maker</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="technical">Technical Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLinkContact} disabled={!selectedContactId || linkContact.isPending}>
                Link Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateContactDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        opportunityId={opportunityId}
      />
    </Card>
  );
};

export default OpportunityContacts;
