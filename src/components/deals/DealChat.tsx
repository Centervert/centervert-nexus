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
import { TypingIndicator } from "./TypingIndicator";
import { ChatAttachment, PendingAttachment } from "./ChatAttachment";

interface Attachment {
  id: string;
  name: string;
  attachment_type: string;
  storage_path: string | null;
  url: string | null;
}

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
  attachments?: Attachment[];
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
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<{ focus: () => void; insertText: (text: string) => void }>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  const loadAttachmentsForMessages = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return {};

    const { data, error } = await supabase
      .from("deal_attachments")
      .select("*")
      .in("message_id", messageIds);

    if (error) {
      console.error("Error loading attachments:", error);
      return {};
    }

    const attachmentsByMessage: Record<string, Attachment[]> = {};
    data?.forEach(att => {
      if (att.message_id) {
        if (!attachmentsByMessage[att.message_id]) {
          attachmentsByMessage[att.message_id] = [];
        }
        attachmentsByMessage[att.message_id].push(att);
      }
    });

    return attachmentsByMessage;
  }, []);

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
            // Load attachments for the new message
            const attachments = await loadAttachmentsForMessages([payload.new.id]);
            const messageWithAttachments = {
              ...data,
              attachments: attachments[payload.new.id] || []
            } as Message;
            setMessages((prev) => [...prev, messageWithAttachments]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, loadAttachmentsForMessages]);

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

  // Setup presence channel for typing indicator
  useEffect(() => {
    if (!currentUserId) return;

    const presenceChannel = supabase.channel(`typing-${dealId}`, {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: { userId: string; name: string }[] = [];
        
        Object.entries(state).forEach(([userId, presences]) => {
          if (userId !== currentUserId && Array.isArray(presences)) {
            const presence = presences[0] as { isTyping?: boolean; name?: string };
            if (presence?.isTyping) {
              users.push({ userId, name: presence.name || "Someone" });
            }
          }
        });
        
        setTypingUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Get current user's profile for name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", currentUserId)
            .single();
          
          await presenceChannel.track({
            isTyping: false,
            name: profile?.full_name || profile?.email || "Someone",
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [dealId, currentUserId]);

  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!presenceChannelRef.current || !currentUserId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", currentUserId)
      .single();

    await presenceChannelRef.current.track({
      isTyping,
      name: profile?.full_name || profile?.email || "Someone",
    });
  }, [currentUserId]);

  const handleTyping = useCallback(() => {
    updateTypingStatus(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  }, [updateTypingStatus]);

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
      // Load attachments for all messages
      const messageIds = data.map(m => m.id);
      const attachments = await loadAttachmentsForMessages(messageIds);
      
      const messagesWithAttachments = data.map(msg => ({
        ...msg,
        attachments: attachments[msg.id] || []
      })) as Message[];
      
      setMessages(messagesWithAttachments);
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files);
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (messageId: string, userId: string) => {
    for (const file of pendingFiles) {
      const filePath = `${userId}/${dealId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("deal-attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      const { error: dbError } = await supabase.from("deal_attachments").insert({
        deal_id: dealId,
        message_id: messageId,
        name: file.name,
        attachment_type: "file",
        storage_path: filePath,
        uploaded_by: userId,
      });

      if (dbError) {
        console.error("DB error:", dbError);
      }
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && pendingFiles.length === 0) return;

    setSending(true);
    setUploading(pendingFiles.length > 0);
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      setSending(false);
      setUploading(false);
      return;
    }

    // Create message (even if empty, if we have files)
    const messageContent = newMessage.trim() || (pendingFiles.length > 0 ? "📎 Shared files" : "");
    
    const { data: messageData, error } = await supabase
      .from("deal_messages")
      .insert({
        deal_id: dealId,
        content: messageContent,
        author_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      setSending(false);
      setUploading(false);
      return;
    }

    // Upload files if any
    if (pendingFiles.length > 0 && messageData) {
      await uploadFiles(messageData.id, userData.user.id);
    }

    setNewMessage("");
    setPendingFiles([]);
    setUploading(false);
    updateTypingStatus(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Reload messages to show attachments
    if (pendingFiles.length > 0) {
      await loadMessages();
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
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.attachments.map((att) => (
                          <ChatAttachment key={att.id} attachment={att} />
                        ))}
                      </div>
                    )}
                    
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

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Pending Files Preview */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 bg-muted/30 border-t">
          {pendingFiles.map((file, index) => (
            <PendingAttachment
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removePendingFile(index)}
            />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="mt-4 border rounded-lg overflow-hidden bg-background">
        <div className="p-2">
          <MentionTextarea
            value={newMessage}
            onChange={(value) => {
              setNewMessage(value);
              handleTyping();
            }}
            placeholder="Type a message... Use @ to mention someone"
            onSubmit={handleSend}
          />
        </div>
        <div className="flex items-center justify-between">
          <ChatToolbar 
            onInsertText={handleInsertText}
            onTriggerMention={handleTriggerMention}
            onFileSelect={handleFileSelect}
            uploading={uploading}
          />
          <div className="pr-2 pb-1">
            <Button
              onClick={handleSend}
              disabled={(!newMessage.trim() && pendingFiles.length === 0) || sending}
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
