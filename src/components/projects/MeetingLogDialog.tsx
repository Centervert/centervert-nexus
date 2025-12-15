import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MeetingLogDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEETING_TYPES = [
  { value: "kickoff", label: "Kickoff" },
  { value: "standup", label: "Standup" },
  { value: "review", label: "Review" },
  { value: "client_call", label: "Client Call" },
  { value: "internal_sync", label: "Internal Sync" },
  { value: "planning", label: "Planning" },
  { value: "retrospective", label: "Retrospective" },
  { value: "other", label: "Other" },
];

export const MeetingLogDialog = ({
  projectId,
  open,
  onOpenChange,
}: MeetingLogDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const createMeetingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("project_meetings")
        .insert({
          project_id: projectId,
          title,
          meeting_type: meetingType || null,
          start_time: new Date(startTime).toISOString(),
          end_time: endTime ? new Date(endTime).toISOString() : null,
          location: location || null,
          description: description || null,
          notes: notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Also create a project update for the activity feed
      await supabase.from("project_updates").insert({
        project_id: projectId,
        content: `Logged meeting: ${title}${meetingType ? ` (${MEETING_TYPES.find(t => t.value === meetingType)?.label || meetingType})` : ""}`,
        update_type: "meeting_logged",
        metadata: { meeting_id: data.id },
        created_by: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-activity", projectId] });
      toast.success("Meeting logged successfully");
      handleClose();
    },
    onError: (error) => {
      console.error("Error logging meeting:", error);
      toast.error("Failed to log meeting");
    },
  });

  const handleClose = () => {
    setTitle("");
    setMeetingType("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setDescription("");
    setNotes("");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime) return;
    createMeetingMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sprint Planning Session"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meetingType">Type</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Zoom, Conference Room"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meeting agenda or purpose"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Meeting Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key discussion points, decisions made, action items..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !startTime || createMeetingMutation.isPending}
            >
              {createMeetingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Log Meeting"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
