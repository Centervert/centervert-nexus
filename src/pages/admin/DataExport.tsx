import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import JSZip from "jszip";

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
      
      // Flatten ticket data to include quote fields directly
      const flattened = tickets?.map(ticket => {
        const latestQuote = ticket.ticket_quotes?.[0];
        return {
          ...ticket,
          quote_amount: latestQuote?.amount,
          quote_status: latestQuote?.status,
          quote_po_number: latestQuote?.po_number,
          quote_payment_status: latestQuote?.payment_status,
          quote_approved_at: latestQuote?.approved_at,
          quote_paid_at: latestQuote?.paid_at,
          ticket_quotes: JSON.stringify(ticket.ticket_quotes),
          ticket_messages: JSON.stringify(ticket.ticket_messages),
          ticket_links: JSON.stringify(ticket.ticket_links),
          ticket_milestones: JSON.stringify(ticket.ticket_milestones),
        };
      });
      
      generateCSV(flattened || [], 'tickets_backup');
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
      // Fetch opportunities data
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

      // Fetch attachments
      const { data: attachments, error: attachmentsError } = await supabase
        .from('opportunity_attachments')
        .select('*');

      if (attachmentsError) throw attachmentsError;

      // Create CSV
      const csvBlob = new Blob(
        [generateCSVContent(opportunities || [])],
        { type: 'text/csv;charset=utf-8;' }
      );

      // Create zip file
      const zip = new JSZip();
      zip.file('opportunities_backup.csv', csvBlob);

      // Download all files from storage
      if (attachments && attachments.length > 0) {
        const filesFolder = zip.folder('files');
        
        for (const attachment of attachments) {
          try {
            // Extract file path from URL
            const urlParts = attachment.file_url.split('/');
            const bucketPath = urlParts.slice(urlParts.indexOf('opportunity-attachments') + 1).join('/');
            
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('opportunity-attachments')
              .download(bucketPath);

            if (!downloadError && fileData) {
              // Organize by opportunity number
              const opportunity = opportunities?.find(o => o.id === attachment.opportunity_id);
              const oppNumber = opportunity?.opportunity_number || 'unknown';
              filesFolder?.file(`${oppNumber}/${attachment.file_name}`, fileData);
            }
          } catch (err) {
            console.error(`Failed to download file: ${attachment.file_name}`, err);
          }
        }
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `opportunities_backup_${timestamp}.zip`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Opportunities exported with files successfully');
    } catch (error) {
      console.error('Error exporting opportunities:', error);
      toast.error('Failed to export opportunities');
    } finally {
      setLoading(null);
    }
  };

  const generateCSVContent = (data: any[]) => {
    if (!data || data.length === 0) return '';

    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    const headers = Array.from(allKeys);
    
    return [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          
          return stringValue;
        }).join(',')
      )
    ].join('\n');
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
              Export all opportunities with tasks, messages, sessions, and all attached files in a zip
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
                  Export Opportunities + Files
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
