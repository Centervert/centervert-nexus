import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectResourceManager } from "@/components/projects/ProjectResourceManager";
import { SecretsRegister } from "@/components/projects/SecretsRegister";

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

interface ProjectDocsTabProps {
  projectId: string;
  canEdit?: boolean;
}

export function ProjectDocsTab({ projectId, canEdit = false }: ProjectDocsTabProps) {
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    loadResources();
  }, [projectId]);

  const loadResources = async () => {
    const { data, error } = await supabase
      .from("project_resources")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (!error) {
      setResources(data || []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
      <h2 className="text-lg font-semibold">Documentation & Resources</h2>
      <ProjectResourceManager
        projectId={projectId}
        resources={resources}
        onResourcesChange={loadResources}
      />
      </div>
      <SecretsRegister projectId={projectId} canEdit={canEdit} />
    </div>
  );
}
