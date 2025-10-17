import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [isAgency, setIsAgency] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [links, setLinks] = useState<Array<{ title: string; url: string; linkType: string }>>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    type: '',
    subtype: '',
    budget: '',
    categoryId: '',
    clientId: '',
    endClientName: '',
  });

  const typeOptions = [
    'Website Development',
    'Bug Fix',
    'Feature Request',
    'Design Work',
    'Consultation',
    'Maintenance',
    'Content Update',
    'SEO/Marketing',
    'Other'
  ];

  const subtypeOptions: Record<string, string[]> = {
    'Website Development': ['Frontend', 'Backend', 'Full Stack', 'E-commerce', 'Landing Page'],
    'Bug Fix': ['UI/UX', 'Functionality', 'Performance', 'Security', 'Mobile Responsive'],
    'Feature Request': ['New Feature', 'Enhancement', 'Integration', 'API'],
    'Design Work': ['Logo', 'Branding', 'UI Design', 'Graphics', 'Mockups'],
    'Consultation': ['Strategy', 'Technical', 'Design', 'SEO', 'General'],
    'Maintenance': ['Updates', 'Monitoring', 'Backup', 'Security Patches'],
    'Content Update': ['Text', 'Images', 'Video', 'Blog Post'],
    'SEO/Marketing': ['On-Page SEO', 'Off-Page SEO', 'Content Strategy', 'Analytics'],
    'Other': ['General']
  };

  const addLink = () => {
    setLinks([...links, { title: '', url: '', linkType: 'reference' }]);
  };

  const updateLink = (index: number, field: string, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

      // Check user role and fetch clients
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const roles = userRoles?.map(r => r.role) || [];
        const isAgencyUser = roles.includes('admin') || roles.includes('agent');
        setIsAgency(isAgencyUser);

        if (isAgencyUser) {
          // Fetch clients for agency users
          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, name')
            .is('deleted_at', null)
            .order('name');
          
          if (clientsError) {
            console.error('Error fetching clients:', clientsError);
          } else {
            setClients(clientsData || []);
          }
        }
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isAgency && !formData.clientId && !newClientName.trim()) {
      toast.error('Please select a client or enter a new client name');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to create a ticket');
        return;
      }

      let clientId = formData.clientId;

      // Create new client if needed
      if (isAgency && showNewClientInput && newClientName.trim()) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: newClientName.trim(),
          })
          .select()
          .single();

        if (clientError) {
          console.error('Error creating client:', clientError);
          toast.error('Failed to create new client');
          setIsSubmitting(false);
          return;
        }

        clientId = newClient.id;
      }

      const insertData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'open',
        created_by: user.id,
      };

      if (formData.type) insertData.type = formData.type.trim();
      if (formData.subtype) insertData.subtype = formData.subtype.trim();
      if (formData.budget) insertData.budget = parseFloat(formData.budget);
      if (formData.categoryId) insertData.category_id = formData.categoryId;
      if (clientId) insertData.client_id = clientId;
      if (formData.endClientName) insertData.end_client_name = formData.endClientName.trim();
      if (dueDate) insertData.due_date = dueDate.toISOString();

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Insert links if any
      if (ticket && links.length > 0) {
        const validLinks = links.filter(link => link.title.trim() && link.url.trim());
        if (validLinks.length > 0) {
          const { error: linksError } = await supabase
            .from('ticket_links')
            .insert(
              validLinks.map(link => ({
                ticket_id: ticket.id,
                title: link.title.trim(),
                url: link.url.trim(),
                link_type: link.linkType,
              }))
            );
          
          if (linksError) {
            console.error('Error creating links:', linksError);
            toast.error('Ticket created but failed to add some links');
          }
        }
      }

      // Upload files if any
      if (ticket && files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${ticket.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(fileName);

          const { error: attachmentError } = await supabase
            .from('attachments')
            .insert({
              ticket_id: ticket.id,
              file_name: file.name,
              file_url: urlData.publicUrl,
              file_type: file.type,
              file_size: file.size,
              uploaded_by: user.id,
            });

          if (attachmentError) {
            console.error('Error creating attachment record:', attachmentError);
          }
        }
      }

      toast.success('Ticket created successfully');
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        type: '',
        subtype: '',
        budget: '',
        categoryId: '',
        clientId: '',
        endClientName: '',
      });
      setDueDate(undefined);
      setLinks([]);
      setFiles([]);
      setShowNewClientInput(false);
      setNewClientName('');

      // Navigate to the new ticket
      if (ticket) {
        navigate(`/tickets/${ticket.id}`);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Submit New Request</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief description of your request"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your request..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="min-h-[160px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value, subtype: '' })}
              >
                <SelectTrigger id="type" className="h-11">
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtype" className="text-sm font-medium">
                Subtype
              </Label>
              <Select
                value={formData.subtype}
                onValueChange={(value) => setFormData({ ...formData, subtype: value })}
                disabled={!formData.type}
              >
                <SelectTrigger id="subtype" className="h-11">
                  <SelectValue placeholder="Select subtype" />
                </SelectTrigger>
                <SelectContent>
                  {formData.type && subtypeOptions[formData.type]?.map((subtype) => (
                    <SelectItem key={subtype} value={subtype}>
                      {subtype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger id="category" className="h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="priority" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium">
              Client {isAgency && <span className="text-destructive">*</span>}
            </Label>
            {isAgency ? (
              <>
                <Select
                  value={showNewClientInput ? 'add-new' : formData.clientId}
                  onValueChange={(value) => {
                    if (value === 'add-new') {
                      setShowNewClientInput(true);
                      setFormData({ ...formData, clientId: '' });
                    } else {
                      setShowNewClientInput(false);
                      setNewClientName('');
                      setFormData({ ...formData, clientId: value });
                    }
                  }}
                >
                  <SelectTrigger id="client" className="h-11">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add-new">+ Add New Client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showNewClientInput && (
                  <Input
                    placeholder="Enter new client name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="h-11 mt-2"
                  />
                )}
              </>
            ) : (
              <Input
                id="client"
                placeholder="Client name (optional)"
                value={formData.endClientName}
                onChange={(e) => setFormData({ ...formData, endClientName: e.target.value })}
                className="h-11"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-sm font-medium">
                Budget (Optional)
              </Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Due Date (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* File Attachments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Attachments (Optional)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="h-8"
              >
                Add Files
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-7 px-2"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supporting Links Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">
                  Supporting Links (Optional)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Add reference materials like:</p>
                      <ul className="text-sm mt-1 space-y-1 list-disc list-inside">
                        <li>Google Docs with requirements</li>
                        <li>Figma design files</li>
                        <li>Existing websites for reference</li>
                        <li>Competitor examples</li>
                        <li>Project specifications</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
                className="h-8"
              >
                Add Link
              </Button>
            </div>
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Link title (e.g., Design Doc)"
                  value={link.title}
                  onChange={(e) => updateLink(index, 'title', e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="URL (e.g., https://docs.google.com/...)"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  className="h-10 flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(index)}
                  className="h-10 px-3"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
