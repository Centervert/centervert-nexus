import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bold, Italic, Strikethrough, AtSign, Smile, Paperclip, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

interface ChatToolbarProps {
  onInsertText: (text: string) => void;
  onTriggerMention: () => void;
  onFileSelect?: (files: FileList) => void;
  uploading?: boolean;
}

const EMOJI_OPTIONS = ["😀", "😂", "😍", "🤔", "👍", "👏", "🎉", "🔥", "❤️", "✅", "🚀", "💯"];

export function ChatToolbar({ onInsertText, onTriggerMention, onFileSelect, uploading }: ChatToolbarProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEmoji = (emoji: string) => {
    onInsertText(emoji);
    setEmojiOpen(false);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-0.5 p-1 border-t border-border bg-muted/30">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
      />
      
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
        className="h-7 w-7 p-0"
        title="Attach file"
        onClick={handleFileClick}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
