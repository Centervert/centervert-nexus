import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  uploaded_by: string;
}

interface TicketFilesProps {
  ticketId: string;
}

export const TicketFiles = ({ ticketId }: TicketFilesProps) => {
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Attachment[];
    },
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDownload = (url: string, fileName: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3">
        <CardTitle className="flex items-center gap-2 flex-1">
          <FileText className="h-5 w-5" />
          Attached Files
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-2 self-start sm:self-center">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload File</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading files...</p>
        ) : attachments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No files attached yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleDownload(file.file_url, file.file_name)}
                  size="sm"
                  variant="ghost"
                  className="gap-2 shrink-0 self-start sm:self-center"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
