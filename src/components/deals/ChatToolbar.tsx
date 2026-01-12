import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bold, Italic, Strikethrough, AtSign, Smile, Paperclip } from "lucide-react";
import { useState } from "react";

interface ChatToolbarProps {
  onInsertText: (text: string) => void;
  onTriggerMention: () => void;
}

const EMOJI_OPTIONS = ["😀", "😂", "😍", "🤔", "👍", "👏", "🎉", "🔥", "❤️", "✅", "🚀", "💯"];

export function ChatToolbar({ onInsertText, onTriggerMention }: ChatToolbarProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  const handleEmoji = (emoji: string) => {
    onInsertText(emoji);
    setEmojiOpen(false);
  };

  return (
    <div className="flex items-center gap-0.5 p-1 border-t border-border bg-muted/30">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onInsertText("**bold**")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onInsertText("_italic_")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onInsertText("~~strikethrough~~")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onTriggerMention}
        title="Mention someone"
      >
        <AtSign className="h-4 w-4" />
      </Button>
      
      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <div className="grid grid-cols-6 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmoji(emoji)}
                className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 opacity-50 cursor-not-allowed"
        title="Attach file (coming soon)"
        disabled
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  );
}
