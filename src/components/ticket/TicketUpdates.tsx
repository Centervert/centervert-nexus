import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface TicketUpdatesProps {
  ticketId: string;
}

export const TicketUpdates = ({ ticketId }: TicketUpdatesProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Message[];
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`ticket_messages:${ticketId}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    if (newMessage.length > 2000) {
      toast.error('Message must be less than 2000 characters');
      return;
    }

    setSending(true);
    try {
      // Get user profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        user_id: user.id,
        user_name: profile?.full_name || user.email || 'Unknown',
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return 'Today';
    }
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>Updates & Communication</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.user_id === user?.id;
              const showDate = index === 0 || 
                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 3600000;
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-xs text-muted-foreground my-4">
                      {formatDate(message.created_at)}
                    </div>
                  )}
                  <div
                    className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} mb-1`}
                  >
                    <span className="text-xs text-muted-foreground mb-1">
                      {formatTime(message.created_at)}
                    </span>
                    <div
                      className={`rounded-[18px] px-4 py-2 max-w-[75%] ${
                        isCurrentUser
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-[15px] leading-[20px] whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="min-h-[80px] resize-none"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-2">
              <Paperclip className="h-4 w-4" />
              Attach File
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {newMessage.length}/2000
              </span>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="gap-2 bg-[#007AFF] hover:bg-[#0051D5]"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
