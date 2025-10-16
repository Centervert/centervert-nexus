import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditTicketDialogProps {
  ticket: any;
}

export const EditTicketDialog = ({ ticket }: EditTicketDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description || '');
  const [priority, setPriority] = useState(ticket.priority);
  const [categoryId, setCategoryId] = useState(ticket.category_id || 'none');
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to || 'unassigned');
  const [dueDate, setDueDate] = useState(
    ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : ''
  );
  const [budget, setBudget] = useState(ticket.budget?.toString() || '');
  const [type, setType] = useState(ticket.type || '');
  const [subtype, setSubtype] = useState(ticket.subtype || '');
  const queryClient = useQueryClient();

  // Reset form when ticket changes
  useEffect(() => {
    setTitle(ticket.title);
    setDescription(ticket.description || '');
    setPriority(ticket.priority);
    setCategoryId(ticket.category_id || 'none');
    setAssignedTo(ticket.assigned_to || 'unassigned');
    setDueDate(ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : '');
    setBudget(ticket.budget?.toString() || '');
    setType(ticket.type || '');
    setSubtype(ticket.subtype || '');
  }, [ticket]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch available agents
  const { data: agents } = useQuery({
    queryKey: ['available-agents'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_agents');
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates: any = {
        title,
        description,
        priority,
        type: type || null,
        subtype: subtype || null,
      };

      if (categoryId && categoryId !== 'none') updates.category_id = categoryId;
      if (assignedTo && assignedTo !== 'unassigned') updates.assigned_to = assignedTo;
      else if (assignedTo === 'unassigned') updates.assigned_to = null;
      if (dueDate) updates.due_date = dueDate;
      if (budget) updates.budget = parseFloat(budget);

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket updated successfully');
      setOpen(false);
    },
    onError: () => {
      toast.error('Failed to update ticket');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Ticket</DialogTitle>
          <DialogDescription>Update ticket details</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
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

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents?.map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name || agent.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g., Bug, Feature"
                />
              </div>

              <div>
                <Label htmlFor="subtype">Subtype</Label>
                <Input
                  id="subtype"
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  placeholder="e.g., UI, Backend"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
