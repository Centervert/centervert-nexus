import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  currentUserId: string | null;
  onReactionChange: () => void;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onReactionChange,
}: MessageReactionsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;

    const existingReaction = reactions.find(r => r.emoji === emoji && r.hasReacted);

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from("deal_message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji);

      if (error) {
        toast({
          title: "Error removing reaction",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from("deal_message_reactions")
        .insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji,
        });

      if (error) {
        toast({
          title: "Error adding reaction",
          description: error.message,
          variant: "destructive",
        });
      }
    }

    onReactionChange();
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReaction(reaction.emoji)}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
            reaction.hasReacted
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted border-border hover:bg-muted/80"
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
