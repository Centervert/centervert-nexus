import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateCSV } from "@/lib/exportUtils";
import { toast } from "sonner";

export default function DataExport() {
  const [loading, setLoading] = useState<string | null>(null);

  const exportTickets = async () => {
    setLoading('tickets');
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_quotes (*),
          ticket_messages (*),
          ticket_links (*),
          ticket_milestones (*)
        `);

      if (error) throw error;
      generateCSV(tickets || [], 'tickets_backup');
      toast.success('Tickets exported successfully');
    } catch (error) {
      console.error('Error exporting tickets:', error);
      toast.error('Failed to export tickets');
    } finally {
      setLoading(null);
    }
  };

  const exportOpportunities = async () => {
    setLoading('opportunities');
    try {
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          opportunity_tasks (*),
          opportunity_messages (*),
          opportunity_work_sessions (*),
          opportunity_contacts (*),
          opportunity_quote_items (*),
          opportunity_document_links (*)
        `);

      if (error) throw error;
      generateCSV(opportunities || [], 'opportunities_backup');
      toast.success('Opportunities exported successfully');
    } catch (error) {
      console.error('Error exporting opportunities:', error);
      toast.error('Failed to export opportunities');
    } finally {
      setLoading(null);
    }
  };

  const exportClients = async () => {
    setLoading('clients');
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*');

      if (error) throw error;
      generateCSV(clients || [], 'clients_backup');
      toast.success('Clients exported successfully');
    } catch (error) {
      console.error('Error exporting clients:', error);
      toast.error('Failed to export clients');
    } finally {
      setLoading(null);
    }
  };

  const exportContacts = async () => {
    setLoading('contacts');
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*');

      if (error) throw error;
      generateCSV(contacts || [], 'contacts_backup');
      toast.success('Contacts exported successfully');
    } catch (error) {
      console.error('Error exporting contacts:', error);
      toast.error('Failed to export contacts');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Export</h1>
        <p className="text-muted-foreground">
          Download backups of your data as CSV files
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              Export all tickets with quotes, messages, links, and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportTickets} 
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'tickets' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Tickets
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunities</CardTitle>
            <CardDescription>
              Export all opportunities with tasks, messages, sessions, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportOpportunities} 
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'opportunities' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Opportunities
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              Export all client information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportClients} 
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'clients' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Clients
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Export all contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportContacts} 
              disabled={loading !== null}
              className="w-full"
            >
              {loading === 'contacts' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Contacts
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
