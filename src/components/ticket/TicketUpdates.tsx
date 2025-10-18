import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Bold, Italic, Code, Link as LinkIcon, Star } from 'lucide-react';
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
        format: 'markdown',
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

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newMessage.substring(start, end);
    const beforeText = newMessage.substring(0, start);
    const afterText = newMessage.substring(end);

    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setNewMessage(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (!url) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newMessage.substring(start, end) || 'link text';
    const beforeText = newMessage.substring(0, start);
    const afterText = newMessage.substring(end);

    const newText = beforeText + `[${selectedText}](${url})` + afterText;
    setNewMessage(newText);
    textarea.focus();
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message, index) => {
            const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                )}
                <div
                  className={`flex flex-col ${
                    message.user_id === currentUserId ? 'items-end' : 'items-start'
                  } group`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 relative ${
                      message.user_id === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${message.is_important ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}`}
                  >
                    {message.is_important && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1">
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{message.user_name}</span>
                      {canToggleImportant(message) && (
                        <button
                          onClick={() =>
                            toggleImportantMutation.mutate({
                              messageId: message.id,
                              isImportant: message.is_important || false,
                            })
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title={message.is_important ? 'Unmark as important' : 'Mark as important'}
                        >
                          <Star
                            className={`h-3 w-3 ${
                              message.is_important ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    <div className="text-sm">{renderMessageContent(message)}</div>
                    <div className="text-xs opacity-70 mt-1">{formatTime(message.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t space-y-2">
        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 mb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('**')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('*')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting('`')}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          {(userRole?.isAdmin || userRole?.isAgent) && (
            <Button
              type="button"
              variant={markAsImportant ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMarkAsImportant(!markAsImportant)}
              title="Mark as important"
              className="gap-2"
            >
              <Star className={`h-4 w-4 ${markAsImportant ? 'fill-current' : ''}`} />
              {markAsImportant && 'Important'}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{newMessage.length} / 1000 characters</span>
          <span>Ctrl+Enter to send</span>
        </div>
      </div>
    </Card>
  );
};
