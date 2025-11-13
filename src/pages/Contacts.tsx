import { useState } from "react";
import { Plus, Search, Trash2, Edit, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CreateContactDialog from "@/components/contacts/CreateContactDialog";
import EditContactDialog from "@/components/contacts/EditContactDialog";
import { useContacts, useDeleteContact, Contact } from "@/hooks/useContacts";
import { format } from "date-fns";

const Contacts = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contacts = [], isLoading } = useContacts();
  const deleteContact = useDeleteContact();

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteContactId(id);
  };

  const confirmDelete = () => {
    if (deleteContactId) {
      deleteContact.mutate(deleteContactId);
      setDeleteContactId(null);
    }
  };

  // Filter contacts based on search
  const filteredContacts = contacts
    .filter((contact) => contact.status === 'active')
    .filter((contact) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        contact.first_name?.toLowerCase().includes(query) ||
        contact.last_name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.organization?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query)
      );
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your contacts and relationships
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Contact
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {filteredContacts.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Active Contacts</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {contacts.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {contacts.filter(c => {
                const created = new Date(c.created_at);
                const now = new Date();
                return created.getMonth() === now.getMonth() && 
                       created.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Companies</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {new Set(contacts.map(c => c.organization).filter(Boolean)).size}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, email, company, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-card border border-border rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading contacts...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No contacts found matching your search." : "No contacts yet. Create your first contact!"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell>{contact.organization || '-'}</TableCell>
                    <TableCell>
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </a>
                      ) : contact.phone_numbers && contact.phone_numbers.length > 0 ? (
                        <a
                          href={`tel:${contact.phone_numbers[0].number}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {contact.phone_numbers[0].number}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.contact_type ? (
                        <Badge variant="secondary">
                          {contact.contact_type}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(contact.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateContactDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedContact && (
        <EditContactDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          contact={selectedContact}
        />
      )}

      <AlertDialog open={!!deleteContactId} onOpenChange={() => setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action will mark the contact as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contacts;
