import { Fragment } from "react";

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  // Parse @mentions and render them with highlighting
  const mentionRegex = /@(\w+(?:\s+\w+)?)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    // Add the highlighted mention
    parts.push(
      <span
        key={match.index}
        className="bg-primary/20 text-primary px-1 py-0.5 rounded font-medium"
      >
        @{match[1]}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return (
    <p className="text-sm whitespace-pre-wrap">
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </p>
  );
}
