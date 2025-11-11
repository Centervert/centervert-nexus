import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, StarOff, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MentionTextarea } from '@/components/messages/MentionTextarea';
import { MessageReactions } from '@/components/messages/MessageReactions';
import { useMarkOpportunityMessagesRead } from '@/hooks/useUnreadMessages';

interface OpportunityMessagesProps {
  opportunityId: string;
}

const OpportunityMessages = ({ opportunityId }: OpportunityMessagesProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [messageMentions, setMessageMentions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markAsRead = useMarkOpportunityMessagesRead();

  // Mark messages as read when component mounts or becomes visible
  useEffect(() => {
    markAsRead.mutate(opportunityId);
  }, [opportunityId]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['opportunity-messages', opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunity_messages')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMessage = useMutation({
    mutationFn: async ({ content, mentions }: { content: string; mentions: string[] }) => {
      const { data, error } = await supabase
        .from('opportunity_messages')
        .insert([{
          opportunity_id: opportunityId,
          user_id: user?.id,
          user_name: profile?.full_name || user?.email || 'Unknown',
          content,
          mentions,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-messages', opportunityId] });
      setNewMessage('');
      setMessageMentions([]);
      toast.success('Message sent');
    },
  });

  const toggleImportant = useMutation({
    mutationFn: async ({ messageId, isImportant }: { messageId: string; isImportant: boolean }) => {
      const { error } = await supabase
        .from('opportunity_messages')
        .update({
          is_important: !isImportant,
          marked_important_at: !isImportant ? new Date().toISOString() : null,
          marked_important_by: !isImportant ? user?.id : null,
        })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-messages', opportunityId] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`opportunity-messages-${opportunityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunity_messages',
          filter: `opportunity_id=eq.${opportunityId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['opportunity-messages', opportunityId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunity_message_reactions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['opportunity-messages', opportunityId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [opportunityId, queryClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    createMessage.mutate({ content: newMessage, mentions: messageMentions });
  };

  const renderMessageContent = (content: string) => {
    // Replace @mentions with bold text
    const parts = content.split(/(@[\w\s]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return <strong key={index} className="font-semibold">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold text-lg">Team Communication</h3>
      <p className="text-sm text-muted-foreground">Internal discussion for your team only</p>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading messages...</p>
        ) : messages?.length === 0 ? (
          <p className="text-center text-muted-foreground">No messages yet</p>
        ) : (
          messages?.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.user_id === user?.id
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-muted'
                } ${message.is_important ? 'ring-2 ring-yellow-500' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold">{message.user_name}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => toggleImportant.mutate({ messageId: message.id, isImportant: message.is_important })}
                    >
                      {message.is_important ? (
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-3 w-3" />
                      )}
                    </Button>
                    <p className="text-xs opacity-70">
                      {format(new Date(message.created_at), "MMM d 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                 <p className="text-sm whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
                 <MessageReactions messageId={message.id} messageType="opportunity" />
               </div>
             </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <MentionTextarea
            value={newMessage}
            onChange={(value, mentions) => {
              setNewMessage(value);
              setMessageMentions(mentions);
            }}
            onSubmit={() => {
              if (newMessage.trim()) {
                createMessage.mutate({ content: newMessage, mentions: messageMentions });
              }
            }}
            placeholder="Type @ to mention someone... (Enter to send, Shift+Enter for new line)"
          />
        </div>
        <Button type="submit" size="icon" disabled={!newMessage.trim() || createMessage.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
};

export default OpportunityMessages;
