import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Download, Trash2, Upload, Eye, MoreVertical, FolderInput } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OpportunityAttachmentsProps {
  opportunityId: string;
}

const OpportunityAttachments = ({ opportunityId }: OpportunityAttachmentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ name: string; url: string; blobUrl?: string } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('supporting_documents');

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

  const updateDocumentType = useMutation({
    mutationFn: async ({ id, documentType }: { id: string; documentType: string }) => {
      const { error } = await supabase
        .from('opportunity_attachments')
        .update({ document_type: documentType })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-attachments', opportunityId] });
      toast.success('Document type updated');
    },
    onError: () => {
      toast.error('Failed to update document type');
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, DOCX, XLS, XLSX files are allowed');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    setPendingFile(file);
    setUploadDialogOpen(true);
    e.target.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile) return;

    setUploading(true);
    try {
      const fileExt = pendingFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${opportunityId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('opportunity-attachments')
        .upload(filePath, pendingFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('opportunity-attachments')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('opportunity_attachments')
        .insert([{
          opportunity_id: opportunityId,
          file_name: pendingFile.name,
          file_url: publicUrl,
          file_type: pendingFile.type,
          file_size: pendingFile.size,
          uploaded_by: user?.id,
          document_type: selectedDocumentType,
        }]);

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['opportunity-attachments', opportunityId] });
      toast.success('File uploaded successfully');
      setUploadDialogOpen(false);
      setPendingFile(null);
      setSelectedDocumentType('supporting_documents');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleViewFile = async (fileName: string, fileUrl: string, fileType: string) => {
    try {
      // PDFs can be displayed directly in iframe
      if (fileType === 'application/pdf') {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setViewingFile({ name: fileName, url: fileUrl, blobUrl });
      } else {
        // For Word/Excel docs, use Google Docs Viewer
        setViewingFile({ name: fileName, url: fileUrl });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error('Failed to load file');
    }
  };

  const handleCloseViewer = () => {
    if (viewingFile?.blobUrl) {
      URL.revokeObjectURL(viewingFile.blobUrl);
    }
    setViewingFile(null);
  };

  const requestDocuments = attachments?.filter(a => a.document_type === 'request_documents') || [];
  const supportingDocuments = attachments?.filter(a => a.document_type === 'supporting_documents') || [];
  const proposalDrafts = attachments?.filter(a => a.document_type === 'proposal_drafts') || [];
  const finalDeliverables = attachments?.filter(a => a.document_type === 'final_deliverables') || [];

  const documentTypes = [
    { value: 'request_documents', label: 'Request Documents' },
    { value: 'supporting_documents', label: 'Supporting Documents' },
    { value: 'proposal_drafts', label: 'Proposal Drafts' },
    { value: 'final_deliverables', label: 'Final Deliverables' },
  ];

  const renderDocumentSection = (title: string, documents: any[], emptyMessage: string) => {
    if (documents.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground">{title}</h4>
        <div className="space-y-2">
          {documents.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{attachment.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(attachment.file_size || 0)} • {format(new Date(attachment.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewFile(attachment.file_name, attachment.file_url, attachment.file_type)}
                  title="View document"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = attachment.file_url;
                    link.download = attachment.file_name;
                    link.click();
                  }}
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                    <div className="px-2 py-1.5 text-sm font-semibold">Move to:</div>
                    {documentTypes.map((type) => (
                      <DropdownMenuItem
                        key={type.value}
                        onClick={() => updateDocumentType.mutate({ id: attachment.id, documentType: type.value })}
                        disabled={attachment.document_type === type.value}
                        className="cursor-pointer"
                      >
                        <FolderInput className="h-4 w-4 mr-2" />
                        {type.label}
                      </DropdownMenuItem>
                    ))}
                    <div className="border-t my-1" />
                    <DropdownMenuItem
                      onClick={() => deleteAttachment.mutate({ id: attachment.id, fileUrl: attachment.file_url })}
                      className="text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="p-6 space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Documents</h3>
              <p className="text-sm text-muted-foreground">Upload and organize opportunity documents</p>
            </div>
            <div>
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
              <Button asChild disabled={uploading}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </label>
              </Button>
            </div>
          </div>
        </div>

      {/* Document Sections */}
      <div className="space-y-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading files...</p>
        ) : (
          <>
            {renderDocumentSection('Request Documents', requestDocuments, 'No request documents uploaded yet')}
            {renderDocumentSection('Supporting Documents', supportingDocuments, 'No supporting documents uploaded yet')}
            {renderDocumentSection('Proposal Drafts', proposalDrafts, 'No proposal drafts uploaded yet')}
            {renderDocumentSection('Final Deliverables', finalDeliverables, 'No final deliverables uploaded yet')}
            
            {attachments?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No documents uploaded yet. Select a document type and upload your first file.
              </div>
            )}
          </>
        )}
      </div>

      {/* File Viewer Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={handleCloseViewer}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>{viewingFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {viewingFile && (
              <iframe
                src={viewingFile.blobUrl || `https://docs.google.com/viewer?url=${encodeURIComponent(viewingFile.url)}&embedded=true`}
                className="w-full h-full"
                title={viewingFile.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>

    {/* Upload Type Selection Dialog */}
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">File:</p>
            <p className="font-medium">{pendingFile?.name}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setUploadDialogOpen(false);
              setPendingFile(null);
              setSelectedDocumentType('supporting_documents');
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUploadConfirm} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default OpportunityAttachments;
