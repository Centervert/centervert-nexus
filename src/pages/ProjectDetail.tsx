import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { ProjectResourceManager } from "@/components/projects/ProjectResourceManager";
import { ProjectActivityFeed } from "@/components/projects/ProjectActivityFeed";
import { ProjectOverviewTab } from "@/components/projects/ProjectOverviewTab";
import { ProjectFeaturesTab } from "@/components/projects/ProjectFeaturesTab";
import { ProjectDecisionsTab } from "@/components/projects/ProjectDecisionsTab";
import { ProjectRisksTab } from "@/components/projects/ProjectRisksTab";
import { ProjectMeetingsTab } from "@/components/projects/ProjectMeetingsTab";
import { ProjectReleasesTab } from "@/components/projects/ProjectReleasesTab";
import { ProjectDocsTab } from "@/components/projects/ProjectDocsTab";
import { ProjectTicketsTab } from "@/components/projects/ProjectTicketsTab";
import { ProjectRoadmapTab } from "@/components/projects/ProjectRoadmapTab";
import { 
  ArrowLeft, 
  Pencil, 
  LayoutGrid,
  Layers,
  FileText,
  AlertTriangle,
  Users,
  Rocket,
  FolderOpen,
  Ticket,
  GanttChart
} from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  health: string | null;
  health_notes: string | null;
  phase_target: string | null;
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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

  const loadTeamMembers = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("project_team_members")
        .select("id, role, user_id")
        .eq("project_id", id);

      if (error) throw error;
      
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
      await Promise.all([loadProject(), loadTeamMembers()]);
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <UnifiedLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
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
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground text-sm mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-0">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="features"
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <Layers className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger 
              value="decisions"
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              Decisions
            </TabsTrigger>
            <TabsTrigger 
              value="risks"
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Risks
            </TabsTrigger>
            <TabsTrigger 
              value="meetings"
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <Users className="h-4 w-4 mr-2" />
              Meetings
            </TabsTrigger>
            <TabsTrigger 
              value="releases"
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Releases
            </TabsTrigger>
            <TabsTrigger 
              value="docs"
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Docs
            </TabsTrigger>
            <TabsTrigger 
              value="tickets"
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger 
              value="roadmap"
              className="data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none px-4 py-2"
            >
              <GanttChart className="h-4 w-4 mr-2" />
              Roadmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ProjectOverviewTab 
              project={project} 
              teamMembers={teamMembers}
              onRefresh={loadProject}
            />
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <ProjectFeaturesTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="decisions" className="mt-6">
            <ProjectDecisionsTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="risks" className="mt-6">
            <ProjectRisksTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <ProjectMeetingsTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="releases" className="mt-6">
            <ProjectReleasesTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="docs" className="mt-6">
            <ProjectDocsTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <ProjectTicketsTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="roadmap" className="mt-6">
            <ProjectRoadmapTab 
              projectId={project.id} 
              projectStartDate={project.start_date}
              projectEndDate={project.target_end_date}
            />
          </TabsContent>
        </Tabs>
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
