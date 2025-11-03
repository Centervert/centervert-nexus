import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DevProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ['dev-project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_projects')
        .select(`
          *,
          client:clients(name),
          project_manager:profiles!dev_projects_project_manager_id_fkey(full_name),
          lead_developer:profiles!dev_projects_lead_developer_id_fkey(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-blue-500/10 text-blue-500',
      in_development: 'bg-purple-500/10 text-purple-500',
      testing: 'bg-yellow-500/10 text-yellow-500',
      staging: 'bg-orange-500/10 text-orange-500',
      production: 'bg-green-500/10 text-green-500',
      maintenance: 'bg-gray-500/10 text-gray-500',
      archived: 'bg-gray-500/10 text-gray-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  const getProjectTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1">
            <div className="flex items-center justify-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!project) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1">
            <div className="flex items-center justify-center h-screen">
              <p>Project not found</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={() => navigate('/dev-projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Code className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h1 className="text-2xl font-semibold">{project.name}</h1>
                  <p className="text-sm text-muted-foreground">#{project.project_number}</p>
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace(/_/g, ' ')}
            </Badge>
          </header>

          <div className="p-6 space-y-6">
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
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DevProjectDetail;
