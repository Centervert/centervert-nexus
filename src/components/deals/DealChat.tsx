import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { MentionTextarea } from "@/components/messages/MentionTextarea";
import { MessageContent } from "./MessageContent";
import { MessageReactions } from "./MessageReactions";
import { ChatToolbar } from "./ChatToolbar";

interface Message {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface DealChatProps {
  dealId: string;
}

export function DealChat({ dealId }: DealChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<{ focus: () => void; insertText: (text: string) => void }>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadReactions = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    const { data, error } = await supabase
      .from("deal_message_reactions")
      .select("*")
      .in("message_id", messageIds);

    if (error) {
      console.error("Error loading reactions:", error);
      return;
    }

    const reactionsByMessage: Record<string, Reaction[]> = {};
    
    messageIds.forEach(id => {
      const messageReactions = data?.filter(r => r.message_id === id) || [];
      const emojiCounts: Record<string, { count: number; hasReacted: boolean }> = {};
      
      messageReactions.forEach(r => {
        if (!emojiCounts[r.emoji]) {
          emojiCounts[r.emoji] = { count: 0, hasReacted: false };
        }
        emojiCounts[r.emoji].count++;
        if (r.user_id === currentUserId) {
          emojiCounts[r.emoji].hasReacted = true;
        }
      });

      reactionsByMessage[id] = Object.entries(emojiCounts).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        hasReacted: data.hasReacted,
      }));
    });

    setReactions(reactionsByMessage);
  }, [currentUserId]);

  useEffect(() => {
    loadMessages();
    getCurrentUser();

    const channel = supabase
      .channel(`deal-messages-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_messages",
          filter: `deal_id=eq.${dealId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("deal_messages")
            .select("*, profiles:author_id(full_name, email, avatar_url)")
            .eq("id", payload.new.id)
            .single();
          
          if (data) {
            setMessages((prev) => [...prev, data as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && currentUserId) {
      loadReactions(messages.map(m => m.id));
    }
  }, [messages, currentUserId, loadReactions]);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setCurrentUserId(data.user.id);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deal_messages")
      .select("*, profiles:author_id(full_name, email, avatar_url)")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMessages(data as Message[]);
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      setSending(false);
      return;
    }

    const { error } = await supabase.from("deal_messages").insert({
      deal_id: dealId,
      content: newMessage.trim(),
      author_id: userData.user.id,
    });

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const formatDateDivider = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d");
  };

  const shouldShowDateDivider = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].created_at);
    const previousDate = new Date(messages[index - 1].created_at);
    return !isSameDay(currentDate, previousDate);
  };

  const shouldShowAvatar = (index: number) => {
    if (index === 0) return true;
    const currentMessage = messages[index];
    const previousMessage = messages[index - 1];
    
    // Show avatar if different author or if there's a date divider
    if (currentMessage.author_id !== previousMessage.author_id) return true;
    if (shouldShowDateDivider(index)) return true;
    
    // Show avatar if more than 5 minutes apart
    const currentTime = new Date(currentMessage.created_at).getTime();
    const previousTime = new Date(previousMessage.created_at).getTime();
    return (currentTime - previousTime) > 5 * 60 * 1000;
  };

  const handleInsertText = (text: string) => {
    setNewMessage(prev => prev + text);
  };

  const handleTriggerMention = () => {
    setNewMessage(prev => prev + "@");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 p-4 bg-muted/20 rounded-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => {
            const showDateDivider = shouldShowDateDivider(index);
            const showAvatar = shouldShowAvatar(index);
            const messageDate = new Date(message.created_at);

            return (
              <div key={message.id}>
                {/* Date Divider */}
                {showDateDivider && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs font-medium text-muted-foreground px-2">
                      {formatDateDivider(messageDate)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                {/* Message */}
                <div className="group flex gap-3 px-2 py-1 hover:bg-muted/50 rounded transition-colors">
                  {/* Avatar or spacer */}
                  <div className="w-9 shrink-0">
                    {showAvatar && (
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={message.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(
                            message.profiles?.full_name || null,
                            message.profiles?.email || ""
                          )}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-sm">
                          {message.profiles?.full_name || message.profiles?.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(messageDate, "h:mm a")}
                        </span>
                      </div>
                    )}
                    <MessageContent content={message.content} />
                    <MessageReactions
                      messageId={message.id}
                      reactions={reactions[message.id] || []}
                      currentUserId={currentUserId}
                      onReactionChange={() => loadReactions(messages.map(m => m.id))}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-4 border rounded-lg overflow-hidden bg-background">
        <div className="p-2">
          <MentionTextarea
            value={newMessage}
            onChange={setNewMessage}
            placeholder="Type a message... Use @ to mention someone"
            onSubmit={handleSend}
          />
        </div>
        <div className="flex items-center justify-between">
          <ChatToolbar 
            onInsertText={handleInsertText}
            onTriggerMention={handleTriggerMention}
          />
          <div className="pr-2 pb-1">
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="h-8"
            >
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
