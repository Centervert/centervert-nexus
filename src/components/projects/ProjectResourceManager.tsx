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
  GripVertical,
  File,
  Code,
  ExternalLink,
} from 'lucide-react';
import { PdfViewerDialog, usePdfViewer } from '@/components/ui/pdf-viewer-dialog';

interface Resource {
  id: string;
  name: string;
  file_name: string | null;
  file_path: string | null;
  url: string | null;
  resource_type: string;
  description: string | null;
  position: number | null;
  created_at: string | null;
}

interface ProjectResourceManagerProps {
  projectId: string;
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
    switch (resource.resource_type) {
      case 'link': return <LinkIcon className="h-4 w-4" />;
      case 'repository': return <Code className="h-4 w-4" />;
      case 'design_file': return <FileText className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (resource.resource_type) {
      case 'link': return 'Link';
      case 'repository': return 'Repository';
      case 'design_file': return 'Design File';
      case 'documentation': return 'Documentation';
      case 'contract': return 'Contract';
      case 'asset': return 'Asset';
      default: return 'File';
    }
  };

  const isLink = resource.resource_type === 'link' || resource.resource_type === 'repository';

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
            {resource.name}
          </p>
          <p className="text-xs text-muted-foreground">{getTypeLabel()}</p>
        </div>
        {isLink && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
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

export const ProjectResourceManager = ({
  projectId,
  resources,
  onResourcesChange,
}: ProjectResourceManagerProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resourceType, setResourceType] = useState<string>('');
  const [resourceName, setResourceName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sortedResources, setSortedResources] = useState<Resource[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  
  const { pdfViewerOpen, setPdfViewerOpen, pdfUrl, pdfName, openPdf } = usePdfViewer();

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
      
      const updates = newSortedResources.map((resource, index) => ({
        id: resource.id,
        position: index,
      }));
      
      for (const update of updates) {
        await supabase
          .from('project_resources')
          .update({ position: update.position })
          .eq('id', update.id);
      }
      
      onResourcesChange();
    }
  };

  const uploadFile = async (file: File, type: string, name: string) => {
    if (!user) return;
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-resources')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const maxPosition = Math.max(...sortedResources.map(r => r.position || 0), -1);

      const { error: dbError } = await supabase
        .from('project_resources')
        .insert([{
          project_id: projectId,
          name: name || file.name,
          file_name: file.name,
          file_path: fileName,
          resource_type: type,
          description: description || null,
          position: maxPosition + 1,
          created_by: user.id,
        }]);

      if (dbError) throw dbError;

      onResourcesChange();
      resetDialog();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!user || !linkUrl || !resourceName) return;
    setIsUploading(true);

    try {
      const maxPosition = Math.max(...sortedResources.map(r => r.position || 0), -1);

      const { error } = await supabase
        .from('project_resources')
        .insert([{
          project_id: projectId,
          name: resourceName,
          url: linkUrl,
          resource_type: resourceType,
          description: description || null,
          position: maxPosition + 1,
          created_by: user.id,
        }]);

      if (error) throw error;

      onResourcesChange();
      resetDialog();
    } catch (error) {
      console.error('Error adding link:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetDialog = () => {
    setIsDialogOpen(false);
    setResourceType('');
    setResourceName('');
    setLinkUrl('');
    setDescription('');
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    const resource = sortedResources.find(r => r.id === id);
    if (!resource) return;

    try {
      if (resource.file_path) {
        await supabase.storage
          .from('project-resources')
          .remove([resource.file_path]);
      }

      const { error } = await supabase
        .from('project_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onResourcesChange();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleResourceClick = async (resource: Resource) => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.file_path) {
      const { data } = await supabase.storage
        .from('project-resources')
        .createSignedUrl(resource.file_path, 3600);
      
      if (data?.signedUrl) {
        if (resource.file_name?.toLowerCase().endsWith('.pdf')) {
          openPdf(data.signedUrl, resource.name);
        } else {
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
      setResourceName(file.name.replace(/\.[^/.]+$/, ''));
      setResourceType('file');
      setIsDialogOpen(true);
    }
  };

  const isLinkType = resourceType === 'link' || resourceType === 'repository';

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
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="repository">Repository</SelectItem>
                  <SelectItem value="design_file">Design File</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="file">Other File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resourceType && (
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  placeholder="e.g., Project Repository"
                />
              </div>
            )}

            {isLinkType ? (
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            ) : resourceType ? (
              <div className="space-y-2">
                <Label>Upload File</Label>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file && !resourceName) {
                      setResourceName(file.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            ) : null}

            {resourceType && (
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isLinkType) {
                  handleAddLink();
                } else if (selectedFile && resourceType && resourceName) {
                  uploadFile(selectedFile, resourceType, resourceName);
                }
              }}
              disabled={
                isUploading ||
                !resourceType ||
                !resourceName ||
                (isLinkType ? !linkUrl : !selectedFile)
              }
            >
              {isUploading ? 'Adding...' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PdfViewerDialog
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={pdfUrl}
        fileName={pdfName}
      />
    </div>
  );
};