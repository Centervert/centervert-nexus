import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useUserRole } from '@/hooks/useUserRole';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  format?: string;
  is_important?: boolean;
  marked_important_by?: string;
}

interface TicketUpdatesProps {
  ticketId: string;
}

export const TicketUpdates = ({ ticketId }: TicketUpdatesProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [markAsImportant, setMarkAsImportant] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { data: userRole } = useUserRole();

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
  });

  // Real-time subscription for INSERT and UPDATE
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleImportantMutation = useMutation({
    mutationFn: async ({ messageId, isImportant }: { messageId: string; isImportant: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ticket_messages')
        .update({
          is_important: !isImportant,
          marked_important_at: !isImportant ? new Date().toISOString() : null,
          marked_important_by: !isImportant ? user.id : null,
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
    },
    onError: () => {
      toast.error('Failed to update message');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('ticket_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    },
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const userName = profile?.full_name || user.email || 'Unknown User';

      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        user_id: user.id,
        user_name: userName,
        content: newMessage,
        format: 'plain',
        is_important: markAsImportant,
        marked_important_at: markAsImportant ? new Date().toISOString() : null,
        marked_important_by: markAsImportant ? user.id : null,
      });

      if (error) throw error;

      setNewMessage('');
      setMarkAsImportant(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessageContent = (message: Message) => {
    if (message.format === 'markdown') {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }

    // Plain text with paragraph support
    const paragraphs = message.content.split('\n\n');
    return paragraphs.map((para, idx) => (
      <p key={idx} className={idx < paragraphs.length - 1 ? 'mb-3' : ''}>
        {para.split('\n').map((line, lineIdx, arr) => (
          <span key={lineIdx}>
            {line}
            {lineIdx < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
    ));
  };

  const canToggleImportant = (message: Message) => {
    return (
      (userRole?.isAdmin || userRole?.isAgent) &&
      (message.user_id === currentUserId || userRole?.isAdmin)
    );
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Updates & Communication</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message, index) => {
            const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);
            const isCurrentUser = message.user_id === currentUserId;

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground font-medium">
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                )}
                <div
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} mb-1 group`}
                >
                  {/* Name above bubble (only for others' messages) */}
                  {!isCurrentUser && (
                    <span className="text-xs text-muted-foreground mb-1 px-3 font-medium">
                      {message.user_name}
                    </span>
                  )}
                  
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <div
                      className={`rounded-[18px] px-4 py-2 relative ${
                        isCurrentUser
                          ? 'bg-[#007AFF] text-white rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      } ${message.is_important ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
                    >
                      {message.is_important && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-sm">
                          <Star className="h-2.5 w-2.5 fill-white text-white" />
                        </div>
                      )}
                      <div className="text-[15px] leading-[20px]">{renderMessageContent(message)}</div>
                    </div>
                    
                    {/* Action buttons on hover */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                      {/* Star button (for admins/agents) */}
                      {canToggleImportant(message) && (
                        <button
                          onClick={() =>
                            toggleImportantMutation.mutate({
                              messageId: message.id,
                              isImportant: message.is_important || false,
                            })
                          }
                          className="p-1 hover:bg-muted rounded"
                          title={message.is_important ? 'Unmark as important' : 'Mark as important'}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              message.is_important ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      )}
                      
                      {/* Delete button (for admins only) */}
                      {userRole?.isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this message?')) {
                              deleteMessageMutation.mutate(message.id);
                            }
                          }}
                          className="p-1 hover:bg-destructive/10 rounded"
                          title="Delete message"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Time below bubble */}
                  <span className="text-[11px] text-muted-foreground mt-0.5 px-3">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t space-y-3">
        {/* Important toggle for admins/agents */}
        {(userRole?.isAdmin || userRole?.isAgent) && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant={markAsImportant ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMarkAsImportant(!markAsImportant)}
              title="Mark as important update"
              className={`gap-1.5 h-8 ${markAsImportant ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}`}
            >
              <Star className={`h-3.5 w-3.5 ${markAsImportant ? 'fill-current' : ''}`} />
              <span className="text-xs">Mark as Important</span>
            </Button>
          </div>
        )}

        {/* Input area with border like iMessage */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none rounded-[20px] border-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary pr-12"
            maxLength={1000}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-[#007AFF] hover:bg-[#0051D5]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-center text-xs text-muted-foreground">
          {newMessage.length} / 1000 characters
        </div>
      </div>
    </Card>
  );
};
