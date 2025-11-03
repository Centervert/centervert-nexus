import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

export const MentionTextarea = ({ value, onChange, placeholder, disabled }: MentionTextareaProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentions, setMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-mentions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      return data as User[];
    },
  });

  const filteredUsers = users.filter((user) => {
    const name = user.full_name || user.email;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Find @ mentions
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      
      // Check if we're in a mention (no space after @)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setSearchTerm(textAfterAt);
        setShowSuggestions(true);

        // Calculate position for suggestions dropdown
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const lineHeight = 20;
          const lines = textBeforeCursor.split('\n').length;
          setSuggestionPosition({
            top: lines * lineHeight,
            left: 10,
          });
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }

    onChange(newValue, mentions);
  };

  const insertMention = (user: User) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Find the @ symbol before cursor
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const name = user.full_name || user.email;
      const beforeAt = value.substring(0, lastAtSymbol);
      const newValue = `${beforeAt}@${name} ${textAfterCursor}`;
      
      // Add user ID to mentions array if not already there
      const newMentions = mentions.includes(user.id) ? mentions : [...mentions, user.id];
      setMentions(newMentions);
      
      onChange(newValue, newMentions);
      setShowSuggestions(false);

      // Set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastAtSymbol + name.length + 2; // +2 for @ and space
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredUsers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
    } else if (e.key === 'Enter' && filteredUsers[selectedIndex]) {
      e.preventDefault();
      insertMention(filteredUsers[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px]"
      />

      {showSuggestions && filteredUsers.length > 0 && (
        <Card
          className="absolute z-[100] w-full max-h-60 overflow-y-auto border-2 shadow-lg mt-1"
          style={{
            top: '100%',
          }}
        >
          <div className="p-1 border-b bg-muted/50">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
              Mention someone
            </div>
          </div>
          <div className="p-1">
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className={`px-3 py-2 cursor-pointer rounded transition-colors ${
                  index === selectedIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-secondary'
                }`}
                onClick={() => insertMention(user)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{user.full_name || user.email}</div>
                    {user.full_name && (
                      <div className={`text-xs truncate ${
                        index === selectedIndex ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
