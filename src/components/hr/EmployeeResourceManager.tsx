import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  FileText, 
  Link as LinkIcon, 
  Upload, 
  Trash2, 
  ExternalLink,
  GripVertical,
  File,
  X
} from 'lucide-react';

interface Resource {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  attachment_type: string | null;
  position: number | null;
  created_at: string | null;
}

interface EmployeeResourceManagerProps {
  employeeId: string;
  resources: Resource[];
  onResourcesChange: () => void;
}

interface SortableResourceItemProps {
  resource: Resource;
  onDelete: (id: string) => void;
  onClick: (resource: Resource) => void;
}

const SortableResourceItem = ({ resource, onDelete, onClick }: SortableResourceItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = () => {
    if (resource.attachment_type === 'link') return <LinkIcon className="h-4 w-4" />;
    if (resource.file_type?.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getTypeLabel = () => {
    switch (resource.attachment_type) {
      case 'employment_agreement': return 'Employment Agreement';
      case 'offer_letter': return 'Offer Letter';
      case 'w9': return 'W-9';
      case 'id_document': return 'ID Document';
      case 'link': return 'Link';
      default: return 'Document';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p 
            className="text-sm font-medium truncate cursor-pointer hover:text-primary"
            onClick={() => onClick(resource)}
          >
            {resource.file_name}
          </p>
          <p className="text-xs text-muted-foreground">{getTypeLabel()}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(resource.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

export const EmployeeResourceManager = ({
  employeeId,
  resources,
  onResourcesChange,
}: EmployeeResourceManagerProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resourceType, setResourceType] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sortedResources, setSortedResources] = useState<Resource[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  
  // PDF Viewer state
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const sorted = [...resources].sort((a, b) => (a.position || 0) - (b.position || 0));
    setSortedResources(sorted);
  }, [resources]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sortedResources.findIndex((r) => r.id === active.id);
      const newIndex = sortedResources.findIndex((r) => r.id === over.id);
      
      const newSortedResources = arrayMove(sortedResources, oldIndex, newIndex);
      setSortedResources(newSortedResources);
      
      // Update positions in database
      const updates = newSortedResources.map((resource, index) => ({
        id: resource.id,
        position: index,
      }));
      
      for (const update of updates) {
        await supabase
          .from('employee_attachments')
          .update({ position: update.position })
          .eq('id', update.id);
      }
      
      onResourcesChange();
    }
  };

  const uploadFile = async (file: File, type: string) => {
    if (!user) return;
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const maxPosition = Math.max(...sortedResources.map(r => r.position || 0), -1);

      const { error: dbError } = await supabase
        .from('employee_attachments')
        .insert([{
          employee_id: employeeId,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
          attachment_type: type,
          position: maxPosition + 1,
          created_by: user.id,
        }]);

      if (dbError) throw dbError;

      onResourcesChange();
      setIsDialogOpen(false);
      setSelectedFile(null);
      setResourceType('');
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!user || !linkUrl || !linkName) return;
    setIsUploading(true);

    try {
      const maxPosition = Math.max(...sortedResources.map(r => r.position || 0), -1);

      const { error } = await supabase
        .from('employee_attachments')
        .insert([{
          employee_id: employeeId,
          file_name: linkName,
          file_path: linkUrl,
          file_type: 'link',
          attachment_type: 'link',
          position: maxPosition + 1,
          created_by: user.id,
        }]);

      if (error) throw error;

      onResourcesChange();
      setIsDialogOpen(false);
      setLinkUrl('');
      setLinkName('');
      setResourceType('');
    } catch (error) {
      console.error('Error adding link:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const resource = sortedResources.find(r => r.id === id);
    if (!resource) return;

    try {
      // Delete from storage if it's a file
      if (resource.attachment_type !== 'link') {
        await supabase.storage
          .from('employee-attachments')
          .remove([resource.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('employee_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onResourcesChange();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleResourceClick = async (resource: Resource) => {
    if (resource.attachment_type === 'link') {
      window.open(resource.file_path, '_blank');
    } else {
      const { data } = await supabase.storage
        .from('employee-attachments')
        .createSignedUrl(resource.file_path, 3600);
      
      if (data?.signedUrl) {
        // Check if it's a PDF - open in viewer
        if (resource.file_type?.includes('pdf')) {
          setPdfUrl(data.signedUrl);
          setPdfName(resource.file_name);
          setPdfViewerOpen(true);
        } else {
          // For other files, open in new tab
          window.open(data.signedUrl, '_blank');
        }
      }
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setResourceType('document');
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Resources</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Resource
        </Button>
      </div>

      <div
        className={`min-h-[100px] border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDraggingFile ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={handleFileDrop}
      >
        {sortedResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Upload className="h-8 w-8 mb-2" />
            <p className="text-sm">Drop files here or click Add Resource</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedResources.map(r => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sortedResources.map((resource) => (
                  <SortableResourceItem
                    key={resource.id}
                    resource={resource}
                    onDelete={handleDelete}
                    onClick={handleResourceClick}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resource Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employment_agreement">Employment Agreement</SelectItem>
                  <SelectItem value="offer_letter">Offer Letter</SelectItem>
                  <SelectItem value="w9">W-9</SelectItem>
                  <SelectItem value="id_document">ID Document</SelectItem>
                  <SelectItem value="document">Other Document</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resourceType === 'link' ? (
              <>
                <div className="space-y-2">
                  <Label>Link Name</Label>
                  <Input
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="e.g., Background Check Portal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            ) : resourceType ? (
              <div className="space-y-2">
                <Label>Upload File</Label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (resourceType === 'link') {
                  handleAddLink();
                } else if (selectedFile && resourceType) {
                  uploadFile(selectedFile, resourceType);
                }
              }}
              disabled={
                isUploading ||
                !resourceType ||
                (resourceType === 'link' ? !linkUrl || !linkName : !selectedFile)
              }
            >
              {isUploading ? 'Adding...' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate pr-4">{pdfName}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in New Tab
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPdfViewerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={pdfName}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
