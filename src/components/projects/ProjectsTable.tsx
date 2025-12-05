import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  status: string;
  health: string | null;
  start_date: string | null;
  target_end_date: string | null;
  project_types?: { name: string; display_name: string } | null;
  organizations?: { name: string } | null;
  owner?: { full_name: string; email: string } | null;
  project_team_members?: { id: string }[];
  project_tasks?: { id: string; status: string }[];
}

interface ProjectsTableProps {
  projects: Project[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (id: string) => {
    navigate(`/projects/${id}`);
  };

  const getHealthColor = (health: string | null) => {
    switch (health) {
      case "on_track":
        return "text-green-600";
      case "at_risk":
        return "text-yellow-600";
      case "off_track":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const formatHealth = (health: string | null) => {
    if (!health) return "—";
    return health.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getTaskProgress = (tasks: { id: string; status: string }[] | undefined) => {
    if (!tasks || tasks.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = tasks.filter((t) => t.status === "done").length;
    const total = tasks.length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No projects found. Create your first project to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Target End</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Tasks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const progress = getTaskProgress(project.project_tasks);
            return (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleRowClick(project.id)}
              >
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {project.project_types?.display_name || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  {project.organizations?.name || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm capitalize">
                    {formatStatus(project.status)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-sm ${getHealthColor(project.health)}`}>
                    {formatHealth(project.health)}
                  </span>
                </TableCell>
                <TableCell>
                  {project.start_date
                    ? format(new Date(project.start_date), "MMM d, yyyy")
                    : "—"}
                </TableCell>
                <TableCell>
                  {project.target_end_date
                    ? format(new Date(project.target_end_date), "MMM d, yyyy")
                    : "—"}
                </TableCell>
                <TableCell>
                  {project.owner?.full_name || project.owner?.email || "—"}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {project.project_team_members?.length || 0}
                  </span>
                </TableCell>
                <TableCell>
                  {progress.total > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
