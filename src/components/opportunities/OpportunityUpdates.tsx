import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { MentionTextarea } from "@/components/messages/MentionTextarea";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface OpportunityUpdatesProps {
  opportunityId: string;
}

interface Update {
  id: string;
  content: string;
  update_type: string;
  metadata: any;
  created_at: string;
  created_by: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

export const OpportunityUpdates = ({ opportunityId }: OpportunityUpdatesProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newUpdate, setNewUpdate] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: updates, isLoading } = useQuery({
    queryKey: ["opportunity-updates", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_updates")
        .select(`
          id,
          content,
          update_type,
          metadata,
          created_at,
          created_by,
          profiles:created_by (
            full_name,
            email
          )
        `)
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Update[];
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (content: string) => {
      // Convert mentions to format @[Name](user_id) for backend processing
      let formattedContent = content;
      
      // Get user names for the mentioned user IDs
      if (mentionedUserIds.length > 0) {
        const { data: mentionedUsers } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", mentionedUserIds);

        if (mentionedUsers) {
          mentionedUsers.forEach((mentionedUser) => {
            const displayName = mentionedUser.full_name || mentionedUser.email;
            // Replace @DisplayName with @[DisplayName](user_id)
            const regex = new RegExp(`@${displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\()`, 'g');
            formattedContent = formattedContent.replace(regex, `@[${displayName}](${mentionedUser.id})`);
          });
        }
      }

      const { data, error } = await supabase
        .from("opportunity_updates")
        .insert({
          opportunity_id: opportunityId,
          content: formattedContent,
          created_by: user?.id,
          update_type: "manual",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-updates", opportunityId] });
      setNewUpdate("");
      setMentionedUserIds([]);
      toast.success("Update posted");
    },
    onError: (error) => {
      console.error("Error creating update:", error);
      toast.error("Failed to post update");
    },
  });

  const handleUpdateChange = (value: string, mentions: string[]) => {
    setNewUpdate(value);
    setMentionedUserIds(mentions);
  };

  const handleSubmit = async () => {
    if (!newUpdate.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createUpdateMutation.mutateAsync(newUpdate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUpdateTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      manual: "Update",
      status_change: "Status Changed",
      assignment_change: "Assignment Changed",
      resource_added: "Resource Added",
    };
    return labels[type] || "Update";
  };

  const getUpdateTypeVariant = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      manual: "default",
      status_change: "secondary",
      assignment_change: "secondary",
      resource_added: "outline",
    };
    return variants[type] || "default";
  };

  // Convert stored mention format @[Name](uuid) back to display format @Name
  const formatContentForDisplay = (content: string) => {
    return content.replace(/@\[([^\]]+)\]\([a-f0-9-]{36}\)/g, '@$1');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Update Form */}
        <div className="space-y-2">
          <MentionTextarea
            value={newUpdate}
            onChange={handleUpdateChange}
            placeholder="Post an update, @mention team members..."
            disabled={isSubmitting}
            onSubmit={handleSubmit}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!newUpdate.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Update
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Updates Feed */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : updates && updates.length > 0 ? (
            updates.map((update) => (
              <div
                key={update.id}
                className="border rounded-lg p-4 space-y-2 bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {update.profiles?.full_name || update.profiles?.email}
                      </span>
                      <Badge variant={getUpdateTypeVariant(update.update_type)} className="text-xs">
                        {getUpdateTypeLabel(update.update_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {formatContentForDisplay(update.content)}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(update.created_at), "MMM d, h:mm a")}
                  </time>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No updates yet</p>
              <p className="text-xs mt-1">Post the first update to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
