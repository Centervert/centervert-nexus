import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DevProjectOverviewProps {
  project: any;
}

export const DevProjectOverview = ({ project }: DevProjectOverviewProps) => {
  const getProjectTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
        <CardDescription>{project.description || 'No description available'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-sm text-muted-foreground">Project Type</span>
            <p className="font-medium">{getProjectTypeLabel(project.project_type)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Priority</span>
            <p className="font-medium capitalize">{project.priority}</p>
          </div>
          {project.client && (
            <div>
              <span className="text-sm text-muted-foreground">Client</span>
              <p className="font-medium">{project.client.name}</p>
            </div>
          )}
          {project.lead_developer && (
            <div>
              <span className="text-sm text-muted-foreground">Lead Developer</span>
              <p className="font-medium">{project.lead_developer.full_name}</p>
            </div>
          )}
          {project.project_manager && (
            <div>
              <span className="text-sm text-muted-foreground">Project Manager</span>
              <p className="font-medium">{project.project_manager.full_name}</p>
            </div>
          )}
          {project.target_launch_date && (
            <div>
              <span className="text-sm text-muted-foreground">Target Launch Date</span>
              <p className="font-medium">
                {new Date(project.target_launch_date).toLocaleDateString()}
              </p>
            </div>
          )}
          {project.repository_url && (
            <div>
              <span className="text-sm text-muted-foreground">Repository</span>
              <p className="font-medium">
                <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  View Repository
                </a>
              </p>
            </div>
          )}
          {project.estimated_hours && (
            <div>
              <span className="text-sm text-muted-foreground">Estimated Hours</span>
              <p className="font-medium">{project.estimated_hours}</p>
            </div>
          )}
          <div>
            <span className="text-sm text-muted-foreground">Actual Hours</span>
            <p className="font-medium">{project.actual_hours || 0}</p>
          </div>
          {project.budget && (
            <div>
              <span className="text-sm text-muted-foreground">Budget</span>
              <p className="font-medium">${Number(project.budget).toLocaleString()}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
