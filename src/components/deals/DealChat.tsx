import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { MentionTextarea } from "@/components/messages/MentionTextarea";

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

interface DealChatProps {
  dealId: string;
}

export function DealChat({ dealId }: DealChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
    getCurrentUser();

    // Subscribe to realtime updates
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
          // Fetch the full message with profile data
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
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.author_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={message.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(
                      message.profiles?.full_name || null,
                      message.profiles?.email || ""
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[70%] ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {message.profiles?.full_name || message.profiles?.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4">
        <div className="flex-1">
          <MentionTextarea
            value={newMessage}
            onChange={setNewMessage}
            placeholder="Type a message... Use @ to mention someone"
            onSubmit={handleSend}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
