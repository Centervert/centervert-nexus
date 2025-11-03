import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Plus, Code, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateProjectDialog } from '@/components/development/CreateProjectDialog';

const DevProjects = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['dev-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_projects')
        .select(`
          *,
          client:clients(name),
          project_manager:profiles!dev_projects_project_manager_id_fkey(full_name),
          lead_developer:profiles!dev_projects_lead_developer_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">Development Projects</h1>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </header>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            #{project.project_number}
                          </span>
                        </div>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">
                            {getProjectTypeLabel(project.project_type)}
                          </span>
                        </div>
                        {project.client && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Client:</span>
                            <span className="font-medium">{project.client.name}</span>
                          </div>
                        )}
                        {project.lead_developer && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lead Dev:</span>
                            <span className="font-medium">
                              {project.lead_developer.full_name}
                            </span>
                          </div>
                        )}
                        {project.target_launch_date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Target Launch:</span>
                            <span className="font-medium">
                              {new Date(project.target_launch_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Code className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Development Projects</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Create your first development project to start tracking app and software development.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Project
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </SidebarProvider>
  );
};

export default DevProjects;
