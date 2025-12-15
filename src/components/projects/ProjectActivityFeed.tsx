import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Activity, Calendar, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { MentionTextarea } from "@/components/messages/MentionTextarea";
import { MeetingLogDialog } from "./MeetingLogDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectActivityFeedProps {
  projectId: string;
}

interface ActivityItem {
  id: string;
  type: "update" | "meeting" | "standup";
  title: string;
  content: string;
  metadata?: any;
  created_at: string;
  created_by: string;
  author_name: string;
  author_email: string;
  update_type?: string;
}

const UPDATE_TYPE_LABELS: Record<string, string> = {
  manual: "Update",
  status_change: "Status Changed",
  assignment_change: "Assignment Changed",
  resource_added: "Resource Added",
  meeting_logged: "Meeting Logged",
  eod_submitted: "EOD Submitted",
};

const UPDATE_TYPE_ICONS: Record<string, typeof Activity> = {
  manual: Activity,
  meeting_logged: Calendar,
  eod_submitted: FileText,
};

export const ProjectActivityFeed = ({ projectId }: ProjectActivityFeedProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newUpdate, setNewUpdate] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  // Fetch unified activity feed
  const { data: activities, isLoading } = useQuery({
    queryKey: ["project-activity", projectId],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      // Fetch project updates
      const { data: updates, error: updatesError } = await supabase
        .from("project_updates")
        .select(`
          id,
          content,
          update_type,
          metadata,
          created_at,
          created_by
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (updatesError) throw updatesError;

      // Fetch meetings
      const { data: meetings, error: meetingsError } = await supabase
        .from("project_meetings")
        .select("*")
        .eq("project_id", projectId)
        .order("start_time", { ascending: false });

      if (meetingsError) throw meetingsError;

      // Fetch EOD standups
      const { data: standups, error: standupsError } = await supabase
        .from("project_daily_standups")
        .select("*")
        .eq("project_id", projectId)
        .order("standup_date", { ascending: false });

      if (standupsError) throw standupsError;

      // Get all unique user IDs
      const userIds = new Set<string>();
      updates?.forEach((u) => userIds.add(u.created_by));
      meetings?.forEach((m) => m.created_by && userIds.add(m.created_by));
      standups?.forEach((s) => userIds.add(s.user_id));

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Convert updates to activity items
      updates?.forEach((update) => {
        const profile = profileMap.get(update.created_by);
        items.push({
          id: `update-${update.id}`,
          type: "update",
          title: UPDATE_TYPE_LABELS[update.update_type] || "Update",
          content: update.content,
          metadata: update.metadata,
          created_at: update.created_at,
          created_by: update.created_by,
          author_name: profile?.full_name || "",
          author_email: profile?.email || "",
          update_type: update.update_type,
        });
      });

      // Convert meetings to activity items (only if not already logged via update)
      meetings?.forEach((meeting) => {
        // Skip if this meeting was logged via the dialog (has corresponding update)
        const hasUpdate = updates?.some(
          (u) => u.update_type === "meeting_logged" && 
            typeof u.metadata === "object" && 
            u.metadata !== null && 
            "meeting_id" in u.metadata && 
            u.metadata.meeting_id === meeting.id
        );
        if (hasUpdate) return;

        const profile = meeting.created_by ? profileMap.get(meeting.created_by) : null;
        items.push({
          id: `meeting-${meeting.id}`,
          type: "meeting",
          title: meeting.title,
          content: meeting.notes || meeting.description || "",
          metadata: {
            meeting_type: meeting.meeting_type,
            start_time: meeting.start_time,
            end_time: meeting.end_time,
            location: meeting.location,
          },
          created_at: meeting.start_time,
          created_by: meeting.created_by || "",
          author_name: profile?.full_name || "",
          author_email: profile?.email || "",
        });
      });

      // Convert standups to activity items
      standups?.forEach((standup) => {
        const profile = profileMap.get(standup.user_id);
        let content = "";
        if (standup.work_performed) {
          const parts = [];
          if (standup.accomplishments) parts.push(`**Accomplishments:** ${standup.accomplishments}`);
          if (standup.blockers) parts.push(`**Blockers:** ${standup.blockers}`);
          if (standup.tomorrow_plan) parts.push(`**Tomorrow:** ${standup.tomorrow_plan}`);
          content = parts.join("\n\n");
        } else {
          content = `No work performed: ${standup.no_work_reason || "No reason provided"}`;
        }

        items.push({
          id: `standup-${standup.id}`,
          type: "standup",
          title: `EOD Report - ${format(new Date(standup.standup_date), "MMM d, yyyy")}`,
          content,
          created_at: standup.submitted_at || standup.standup_date,
          created_by: standup.user_id,
          author_name: profile?.full_name || "",
          author_email: profile?.email || "",
        });
      });

      // Sort by date descending
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return items;
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`project-activity-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_updates",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["project-activity", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const createUpdateMutation = useMutation({
    mutationFn: async (content: string) => {
      let formattedContent = content;

      if (mentionedUserIds.length > 0) {
        const { data: mentionedUsers } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", mentionedUserIds);

        if (mentionedUsers) {
          mentionedUsers.forEach((mentionedUser) => {
            const displayName = mentionedUser.full_name || mentionedUser.email;
            const regex = new RegExp(
              `@${displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\()`,
              "g"
            );
            formattedContent = formattedContent.replace(
              regex,
              `@[${displayName}](${mentionedUser.id})`
            );
          });
        }
      }

      const { error } = await supabase.from("project_updates").insert({
        project_id: projectId,
        content: formattedContent,
        created_by: user?.id,
        update_type: "manual",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-activity", projectId] });
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

  const formatContentForDisplay = (content: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    const mentionRegex = /@\[([^\]]+)\]\([a-f0-9-]{36}\)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      parts.push(
        <span key={match.index} className="text-primary font-medium">
          @{match[1]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const getActivityIcon = (item: ActivityItem) => {
    if (item.type === "meeting") return Calendar;
    if (item.type === "standup") return FileText;
    return UPDATE_TYPE_ICONS[item.update_type || "manual"] || Activity;
  };

  const getActivityColor = (item: ActivityItem) => {
    if (item.type === "meeting") return "text-blue-500 bg-blue-500/10";
    if (item.type === "standup") return "text-purple-500 bg-purple-500/10";
    if (item.update_type === "status_change") return "text-orange-500 bg-orange-500/10";
    return "text-muted-foreground bg-muted";
  };

  const filteredActivities = activities?.filter((item) => {
    if (filterTypes.length === 0) return true;
    return filterTypes.includes(item.type);
  });

  const toggleFilter = (type: string) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity & Logs
            </CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    {filterTypes.length > 0 && (
                      <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                        {filterTypes.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={filterTypes.includes("update")}
                    onCheckedChange={() => toggleFilter("update")}
                  >
                    Updates
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterTypes.includes("meeting")}
                    onCheckedChange={() => toggleFilter("meeting")}
                  >
                    Meetings
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterTypes.includes("standup")}
                    onCheckedChange={() => toggleFilter("standup")}
                  >
                    EOD Reports
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setMeetingDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Log Meeting
              </Button>
            </div>
          </div>
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

          {/* Activity Feed */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredActivities && filteredActivities.length > 0 ? (
              filteredActivities.map((item) => {
                const Icon = getActivityIcon(item);
                const colorClasses = getActivityColor(item);

                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 space-y-2 bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", colorClasses)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {item.author_name || item.author_email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.title}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                            {format(new Date(item.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>

                        {/* Meeting details */}
                        {item.type === "meeting" && item.metadata && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            {item.metadata.meeting_type && (
                              <span className="capitalize">{item.metadata.meeting_type.replace("_", " ")}</span>
                            )}
                            {item.metadata.location && <span>📍 {item.metadata.location}</span>}
                            {item.metadata.start_time && (
                              <span>
                                {format(new Date(item.metadata.start_time), "h:mm a")}
                                {item.metadata.end_time &&
                                  ` - ${format(new Date(item.metadata.end_time), "h:mm a")}`}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        {item.content && (
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {formatContentForDisplay(item.content)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs mt-1">
                  Post an update or log a meeting to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <MeetingLogDialog
        projectId={projectId}
        open={meetingDialogOpen}
        onOpenChange={setMeetingDialogOpen}
      />
    </>
  );
};
