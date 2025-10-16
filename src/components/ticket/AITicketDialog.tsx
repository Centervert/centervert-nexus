import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TicketData {
  title: string;
  description: string;
  client_id: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category_id?: string;
  assigned_to?: string;
  due_date?: string;
  budget?: number;
  type?: string;
  subtype?: string;
}

interface Client {
  id: string;
  name: string;
  client_type: string;
}

interface Category {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  full_name: string;
  email: string;
}

interface AITicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AITicketDialog = ({ open, onOpenChange }: AITicketDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch context data when dialog opens
  useEffect(() => {
    if (open) {
      fetchContextData();
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your AI ticket assistant. Tell me what you need help with, and I'll create a ticket for you. Just describe the issue or request in your own words."
      }]);
    }
  }, [open]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const fetchContextData = async () => {
    try {
      // Fetch active clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, client_type')
        .eq('is_active', true)
        .is('deleted_at', null);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name');

      // Fetch available agents
      const { data: agentsData } = await supabase
        .rpc('get_available_agents');

      setClients(clientsData || []);
      setCategories(categoriesData || []);
      setAgents(agentsData || []);
    } catch (error) {
      console.error('Error fetching context:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket context',
        variant: 'destructive'
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user?.id)
        .single();

      const context = {
        clients,
        categories,
        agents,
        currentUser: {
          id: user?.id || '',
          email: userData.user?.email || '',
          full_name: profile?.full_name || userData.user?.email || ''
        }
      };

      const response = await supabase.functions.invoke('ai-ticket-assistant', {
        body: {
          messages: [...messages, userMessage],
          context
        }
      });

      if (response.error) {
        throw response.error;
      }

      const { data } = response;

      if (data.error) {
        if (data.error === 'rate_limit') {
          toast({
            title: 'Rate Limit Exceeded',
            description: data.message,
            variant: 'destructive'
          });
        } else if (data.error === 'payment_required') {
          toast({
            title: 'Credits Exhausted',
            description: data.message,
            variant: 'destructive'
          });
        } else {
          throw new Error(data.error);
        }
        setIsLoading(false);
        return;
      }

      if (data.type === 'create_client') {
        // AI wants to create a new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: data.clientData.name,
            client_type: data.clientData.client_type,
            is_active: true
          })
          .select()
          .single();

        if (clientError) {
          console.error('Error creating client:', clientError);
          toast({
            title: 'Error',
            description: 'Failed to create new client. Please try again.',
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }

        // Store the new client ID for later reminder
        setNewClientId(newClient.id);

        // Update clients list
        setClients(prev => [...prev, {
          id: newClient.id,
          name: newClient.name,
          client_type: newClient.client_type
        }]);

        // Show confirmation message
        const confirmMessage = `Great! I've created "${newClient.name}" as a new ${data.clientData.client_type} client. Now I can proceed with creating your ticket.`;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: confirmMessage
        }]);
        
        setIsLoading(false);
        
        // Give AI a moment to process before continuing
        setTimeout(() => {
          // Add a system message to continue with ticket creation
          const continueMessage = "Please tell me more about the ticket you'd like to create for this client.";
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: continueMessage
          }]);
        }, 500);
      } else if (data.type === 'ticket_data') {
        // AI extracted ticket data
        setTicketData(data.ticketData);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || "I've gathered the ticket information. Please review the details below and click 'Create Ticket' when ready."
        }]);
      } else {
        // Regular conversational response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to communicate with AI assistant',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async () => {
    if (!ticketData) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: ticketData.title,
          description: ticketData.description,
          client_id: ticketData.client_id,
          priority: ticketData.priority || 'medium',
          category_id: ticketData.category_id || null,
          assigned_to: ticketData.assigned_to || null,
          due_date: ticketData.due_date || null,
          budget: ticketData.budget || null,
          type: ticketData.type || null,
          subtype: ticketData.subtype || null,
          created_by: user?.id,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      // Check if we created a new client during this conversation
      const clientReminder = newClientId 
        ? " Don't forget to visit the client record to add additional information like contact details, billing address, and other details."
        : "";

      toast({
        title: 'Success',
        description: `Ticket created successfully!${clientReminder}`,
        duration: clientReminder ? 7000 : 3000,
      });

      onOpenChange(false);
      navigate(`/tickets/${data.id}`);
      
      // Reset state
      setMessages([]);
      setTicketData(null);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create ticket. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const clearConversation = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm your AI ticket assistant. Tell me what you need help with, and I'll create a ticket for you."
    }]);
    setTicketData(null);
    setNewClientId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Ticket Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Ticket Preview */}
          {ticketData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Preview</CardTitle>
                <CardDescription>Review and edit before creating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={ticketData.title}
                    onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={ticketData.description}
                    onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select
                      value={ticketData.client_id}
                      onValueChange={(value) => setTicketData({ ...ticketData, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={ticketData.priority || 'medium'}
                      onValueChange={(value: any) => setTicketData({ ...ticketData, priority: value })}
                    >
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category (Optional)</Label>
                    <Select
                      value={ticketData.category_id || 'none'}
                      onValueChange={(value) => setTicketData({ ...ticketData, category_id: value === 'none' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To (Optional)</Label>
                    <Select
                      value={ticketData.assigned_to || 'none'}
                      onValueChange={(value) => setTicketData({ ...ticketData, assigned_to: value === 'none' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={createTicket}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Input Area */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Textarea
                ref={inputRef as any}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Describe what you need help with... (Ctrl+Enter to send)"
                disabled={isLoading}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearConversation}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
