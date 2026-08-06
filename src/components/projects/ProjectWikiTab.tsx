import { WikiWorkspace } from "@/components/wiki/WikiWorkspace";

interface ProjectWikiTabProps {
  projectId: string;
  canEdit: boolean;
}

export function ProjectWikiTab({ projectId, canEdit }: ProjectWikiTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Wiki</h2>
        <p className="text-sm text-muted-foreground">
          Meeting notes, process docs, architecture notes and runbooks for this project.
        </p>
      </div>
      <WikiWorkspace
        projectId={projectId}
        canEdit={canEdit}
        emptyLabel="No pages yet — create the first page for this project."
      />
    </div>
  );
}
