import { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send, Pencil, Trash2, Check, X } from 'lucide-react';

interface EmployeeActivityFeedProps {
  employeeId: string;
}

interface NoteRow {
  id: string;
  employee_id: string;
  content: string;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthorProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const CATEGORIES = [
  { value: 'general', label: 'General', color: 'text-muted-foreground' },
  { value: 'payroll', label: 'Payroll', color: 'text-blue-600' },
  { value: 'bonus', label: 'Bonus', color: 'text-green-600' },
  { value: 'performance', label: 'Performance', color: 'text-purple-600' },
  { value: 'schedule', label: 'Schedule', color: 'text-amber-600' },
];

function categoryMeta(value: string | null) {
  return CATEGORIES.find((c) => c.value === value);
}

export const EmployeeActivityFeed = ({ employeeId }: EmployeeActivityFeedProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const notesKey = ['employee-notes', employeeId];

  const { data: notes = [], isLoading } = useQuery({
    queryKey: notesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_notes' as any)
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as NoteRow[];
    },
  });

  const authorIds = Array.from(
    new Set(notes.map((n) => n.created_by).filter((v): v is string => !!v))
  );

  const { data: authors = [] } = useQuery({
    queryKey: ['employee-notes-authors', authorIds.join(',')],
    enabled: authorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', authorIds);
      if (error) throw error;
      return (data || []) as AuthorProfile[];
    },
  });

  const authorMap = new Map(authors.map((a) => [a.id, a]));

  useEffect(() => {
    const channel = supabase
      .channel(`employee_notes:${employeeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_notes', filter: `employee_id=eq.${employeeId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: notesKey });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [notes.length]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('employee_notes' as any).insert({
        employee_id: employeeId,
        content: trimmed,
        category,
        created_by: user.id,
      } as any);
      if (error) throw error;
      setContent('');
      setCategory('general');
      queryClient.invalidateQueries({ queryKey: notesKey });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to post note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      const { error } = await supabase
        .from('employee_notes' as any)
        .update({ content: trimmed } as any)
        .eq('id', id);
      if (error) throw error;
      setEditingId(null);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: notesKey });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update note');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const { error } = await supabase.from('employee_notes' as any).delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: notesKey });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete note');
    }
  };

  const authorName = (createdBy: string | null) => {
    if (!createdBy) return 'AI Agent';
    const a = authorMap.get(createdBy);
    return a?.full_name || a?.email || 'Unknown';
  };

  const initial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">Activity & Comments</h3>
        <p className="text-xs text-muted-foreground">
          Running log of updates. Use this for bonuses, payroll changes, and other notes.
        </p>
      </div>

      <div
        ref={listRef}
        className="max-h-80 overflow-y-auto space-y-3 border rounded-md p-3 bg-muted/20"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No activity yet. Post the first update below.
          </p>
        ) : (
          notes.map((note) => {
            const meta = categoryMeta(note.category);
            const name = authorName(note.created_by);
            const isOwn = user && note.created_by === user.id;
            return (
              <div key={note.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {initial(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-medium text-foreground">{name}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                    {meta && (
                      <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                    )}
                    {note.updated_at !== note.created_at && (
                      <span className="text-muted-foreground italic">edited</span>
                    )}
                    {isOwn && editingId !== note.id && (
                      <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => handleDelete(note.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </div>
                  {editingId === note.id ? (
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSaveEdit(note.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                          }}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap mt-0.5 text-foreground">
                      {note.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Add an update… (Enter to post, Shift+Enter for newline)"
            rows={2}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="self-end"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};