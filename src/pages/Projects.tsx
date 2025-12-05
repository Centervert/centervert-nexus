import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectDialog } from "@/components/projects/ProjectDialog";

const COMPLETED_STATUSES = ["completed", "cancelled", "on_hold"];

interface ProjectType {
  id: string;
  name: string;
  display_name: string;
}

export default function Projects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "completed">("active");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadProjects();
    loadProjectTypes();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, statusFilter, typeFilter, currentUserId]);

  const loadProjectTypes = async () => {
    const { data } = await supabase
      .from("project_types")
      .select("id, name, display_name")
      .order("display_name");
    
    if (data) {
      setProjectTypes(data);
    }
  };

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        setCurrentUserId(session.session.user.id);
      }

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_types (name, display_name),
          organizations (name),
          owner:profiles!projects_owner_id_fkey (full_name, email),
          project_team_members (id),
          project_tasks (id, status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Filter by status (active vs completed)
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => !COMPLETED_STATUSES.includes(p.status));
    } else {
      filtered = filtered.filter((p) => COMPLETED_STATUSES.includes(p.status));
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((p) => p.project_type_id === typeFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.organizations?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  };

  // Count projects for tab labels
  const activeCount = projects.filter((p) => !COMPLETED_STATUSES.includes(p.status)).length;
  const completedCount = projects.filter((p) => COMPLETED_STATUSES.includes(p.status)).length;

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your active work
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>

        <ProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={loadProjects}
        />

        <div className="flex flex-col gap-4">
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "active" | "completed")}
          >
            <TabsList>
              <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {projectTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading projects...
          </div>
        ) : (
          <ProjectsTable projects={filteredProjects} />
        )}
      </div>
    </UnifiedLayout>
  );
}
