import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OpportunityAttachmentsProps {
  opportunityId: string;
}

const OpportunityAttachments = ({ opportunityId }: OpportunityAttachmentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: attachments, isLoading } = useQuery({
    queryKey: ['opportunity-attachments', opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunity_attachments')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: async ({ id, fileUrl }: { id: string; fileUrl: string }) => {
      const filePath = fileUrl.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('opportunity-attachments')
          .remove([`${opportunityId}/${filePath}`]);
      }
      
      const { error } = await supabase
        .from('opportunity_attachments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-attachments', opportunityId] });
      toast.success('File deleted');
    },
    onError: () => {
      toast.error('Failed to delete file');
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, DOCX, XLS, XLSX files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${opportunityId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('opportunity-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('opportunity-attachments')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('opportunity_attachments')
        .insert([{
          opportunity_id: opportunityId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user?.id,
        }]);

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['opportunity-attachments', opportunityId] });
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Documents</h3>
          <p className="text-sm text-muted-foreground">Upload RFPs, proposals, and supporting documents</p>
        </div>
        <div>
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </label>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading files...</p>
        ) : attachments?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
        ) : (
          attachments?.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{attachment.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(attachment.file_size || 0)} • {format(new Date(attachment.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(attachment.file_url, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAttachment.mutate({ id: attachment.id, fileUrl: attachment.file_url })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default OpportunityAttachments;
