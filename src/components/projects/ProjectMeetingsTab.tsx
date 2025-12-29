import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { MeetingLogDialog } from "@/components/projects/MeetingLogDialog";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_type: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  notes: string | null;
}

interface ProjectMeetingsTabProps {
  projectId: string;
}

export function ProjectMeetingsTab({ projectId }: ProjectMeetingsTabProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, [projectId]);

  const loadMeetings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_meetings")
      .select("*")
      .eq("project_id", projectId)
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error loading meetings:", error);
      toast.error("Failed to load meetings");
    } else {
      setMeetings(data || []);
    }
    setLoading(false);
  };

  const getMeetingTypeColor = (type: string | null) => {
    switch (type) {
      case "standup": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "planning": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "review": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "retro": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Meetings</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Meeting
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No meetings logged yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{meeting.title}</p>
                      {meeting.meeting_type && (
                        <Badge className={getMeetingTypeColor(meeting.meeting_type)}>
                          {meeting.meeting_type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(meeting.start_time), "MMM d, yyyy 'at' h:mm a")}
                      {meeting.end_time && (
                        <> - {format(new Date(meeting.end_time), "h:mm a")}</>
                      )}
                    </p>
                    {meeting.location && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {meeting.location}
                      </p>
                    )}
                    {meeting.description && (
                      <p className="text-sm mt-2">{meeting.description}</p>
                    )}
                    {meeting.notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MeetingLogDialog
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) loadMeetings();
        }}
      />
    </div>
  );
}
