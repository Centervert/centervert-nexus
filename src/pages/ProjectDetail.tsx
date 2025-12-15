import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { ProjectResourceManager } from "@/components/projects/ProjectResourceManager";
import { ProjectActivityFeed } from "@/components/projects/ProjectActivityFeed";
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Calendar, 
  Building2, 
  User
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Json } from "@/integrations/supabase/types";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  health: string | null;
  health_notes: string | null;
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  project_type_id: string | null;
  organization_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  owner_id: string | null;
  created_at: string | null;
  created_by: string | null;
  eod_required_roles: Json | null;
  project_type?: { id: string; name: string; display_name: string } | null;
  organization?: { id: string; name: string } | null;
  owner?: { id: string; full_name: string | null; email: string } | null;
  contact?: { id: string; first_name: string; last_name: string } | null;
}

interface Resource {
  id: string;
  name: string;
  resource_type: string;
  file_path: string | null;
  file_name: string | null;
  url: string | null;
  description: string | null;
  position: number | null;
  created_at: string | null;
}

interface TeamMember {
  id: string;
  role: string;
  user_id: string;
  full_name: string | null;
  email: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadProject = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_type:project_types(id, name, display_name),
          organization:organizations(id, name),
          owner:profiles!projects_owner_id_fkey(id, full_name, email),
          contact:contacts(id, first_name, last_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project");
      navigate("/projects");
    }
  };

  const loadResources = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("project_resources")
        .select("*")
        .eq("project_id", id)
        .order("position", { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error("Error loading resources:", error);
    }
  };

  const loadTeamMembers = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("project_team_members")
        .select("id, role, user_id")
        .eq("project_id", id);

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = (data || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const membersWithProfiles = (data || []).map(m => {
        const profile = profiles?.find(p => p.id === m.user_id);
        return {
          ...m,
          full_name: profile?.full_name || null,
          email: profile?.email || "Unknown"
        };
      });
      
      setTeamMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadProject(), loadResources(), loadTeamMembers()]);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      toast.success("Project deleted successfully");
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600";
      case "on_hold": return "bg-yellow-500/10 text-yellow-600";
      case "completed": return "bg-blue-500/10 text-blue-600";
      case "cancelled": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getHealthColor = (health: string | null) => {
    switch (health) {
      case "on_track": return "bg-green-500/10 text-green-600";
      case "at_risk": return "bg-yellow-500/10 text-yellow-600";
      case "off_track": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <UnifiedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </UnifiedLayout>
    );
  }

  if (!project) {
    return (
      <UnifiedLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
          <Button variant="outline" onClick={() => navigate("/projects")} className="mt-4">
            Back to Projects
          </Button>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {project.project_type && (
                  <span className="text-sm text-muted-foreground">
                    {project.project_type.display_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Status & Health */}
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(project.status)}`}>
            {formatStatus(project.status)}
          </div>
          {project.health && (
            <div className={`px-3 py-1 rounded-md text-sm font-medium ${getHealthColor(project.health)}`}>
              Health: {formatStatus(project.health)}
            </div>
          )}
        </div>

        {/* Activity & Logs - Full Width */}
        <ProjectActivityFeed projectId={project.id} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {project.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {project.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Health Notes */}
            {project.health_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Health Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {project.health_notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members assigned</p>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {member.full_name || member.email}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{member.role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectResourceManager
                  projectId={project.id}
                  resources={resources}
                  onResourcesChange={loadResources}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.organization && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Organization</p>
                      <button
                        onClick={() => navigate(`/organizations/${project.organization?.id}`)}
                        className="text-sm hover:underline text-primary"
                      >
                        {project.organization.name}
                      </button>
                    </div>
                  </div>
                )}

                {project.owner && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="text-sm">{project.owner.full_name || project.owner.email}</p>
                    </div>
                  </div>
                )}

                {project.contact && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Contact</p>
                      <button
                        onClick={() => navigate(`/contacts/${project.contact?.id}`)}
                        className="text-sm hover:underline text-primary"
                      >
                        {project.contact.first_name} {project.contact.last_name}
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.start_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="text-sm">{format(new Date(project.start_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                )}

                {project.target_end_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Target End Date</p>
                      <p className="text-sm">{format(new Date(project.target_end_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                )}

                {project.actual_end_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Actual End Date</p>
                      <p className="text-sm">{format(new Date(project.actual_end_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-8 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this project? This action cannot be undone and will remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <ProjectDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        project={project}
        onSuccess={() => {
          loadProject();
          setIsEditDialogOpen(false);
        }}
      />
    </UnifiedLayout>
  );
};

export default ProjectDetail;
