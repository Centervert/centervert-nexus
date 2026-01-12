interface TypingIndicatorProps {
  typingUsers: { userId: string; name: string }[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground">
      <div className="flex gap-0.5">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
      </div>
      <span className="italic">{getTypingText()}</span>
    </div>
  );
}
