import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TextPart {
  type: 'text' | 'link';
  content: string;
}

export function parseLinksAndMentions(text: string): TextPart[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map(part => {
    if (part.match(urlRegex)) {
      return { type: 'link', content: part };
    }
    return { type: 'text', content: part };
  });
}
