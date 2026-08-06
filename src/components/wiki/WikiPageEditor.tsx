import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { WikiPageRow } from "@/lib/wiki";

interface WikiPageEditorProps {
  page: WikiPageRow;
  editorName?: string | null;
  canEdit: boolean;
  saving?: boolean;
  onSave: (values: { title: string; body: string }) => Promise<void> | void;
  onDelete: () => void;
}

export function WikiPageEditor({
  page,
  editorName,
  canEdit,
  saving,
  onSave,
  onDelete,
}: WikiPageEditorProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);

  useEffect(() => {
    setEditing(false);
    setTitle(page.title);
    setBody(page.body);
  }, [page.id, page.updated_at]);

  const handleSave = async () => {
    await onSave({ title: title.trim() || "Untitled", body });
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
              placeholder="Page title"
            />
          ) : (
            <h2 className="text-lg font-semibold truncate">{page.title}</h2>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Updated {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}
            {editorName ? ` by ${editorName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && !editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} title="Delete page">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
          {editing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setTitle(page.title);
                  setBody(page.body);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <Tabs defaultValue="write">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="mt-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write in markdown..."
              className="min-h-[420px] font-mono text-sm"
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-3">
            <MarkdownBody content={body} />
          </TabsContent>
        </Tabs>
      ) : (
        <MarkdownBody content={page.body} />
      )}
    </div>
  );
}

export function MarkdownBody({ content }: { content: string }) {
  if (!content?.trim()) {
    return <p className="text-sm text-muted-foreground">This page is empty.</p>;
  }
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_h2]:mt-6 [&_h2]:mb-2 [&_a]:text-primary">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
