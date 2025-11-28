import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OpportunityTeamMembersProps {
  opportunityId: string;
  managerId?: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string | null;
  added_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface AvailableAgent {
  id: string;
  email: string;
  full_name: string | null;
}

export const OpportunityTeamMembers = ({ opportunityId, managerId }: OpportunityTeamMembersProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["opportunity-team-members", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_team_members")
        .select(`
          id,
          user_id,
          role,
          added_at,
          profiles!opportunity_team_members_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq("opportunity_id", opportunityId)
        .order("added_at", { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const { data: availableAgents } = useQuery({
    queryKey: ["available-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_available_agents");
      if (error) throw error;
      return data as AvailableAgent[];
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from("opportunity_team_members")
        .insert({
          opportunity_id: opportunityId,
          user_id: userId,
          added_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-team-members", opportunityId] });
      setSelectedUserId("");
      toast.success("Team member added");
    },
    onError: (error: any) => {
      console.error("Error adding team member:", error);
      if (error.code === "23505") {
        toast.error("This user is already a team member");
      } else {
        toast.error("Failed to add team member");
      }
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("opportunity_team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-team-members", opportunityId] });
      toast.success("Team member removed");
      setMemberToRemove(null);
    },
    onError: (error) => {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    },
  });

  const handleAddMember = () => {
    if (!selectedUserId) return;
    addMemberMutation.mutate(selectedUserId);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(" ");
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Filter out users who are already team members or the manager
  const availableUsers = availableAgents?.filter(
    (agent) =>
      agent.id !== managerId &&
      !teamMembers?.some((member) => member.user_id === agent.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Team Member */}
        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select team member to add" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers?.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.full_name || agent.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddMember}
            disabled={!selectedUserId || addMemberMutation.isPending}
            size="sm"
          >
            {addMemberMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>

        {/* Team Members List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(member.profiles?.full_name, member.profiles?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.profiles?.full_name || member.profiles?.email}
                    </p>
                    {member.role && (
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMemberToRemove(member.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No team members yet</p>
              <p className="text-xs mt-1">Add team members to collaborate</p>
            </div>
          )}
        </div>

        {/* Remove Confirmation Dialog */}
        <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove team member?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this user from the opportunity team. They will no longer receive updates or be able to collaborate on this opportunity.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => memberToRemove && removeMemberMutation.mutate(memberToRemove)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
