import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code, Loader2, ExternalLink, FileText, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DevProjectOverview } from '@/components/development/DevProjectOverview';
import { DevProjectTasks } from '@/components/development/DevProjectTasks';
import { DevProjectSprints } from '@/components/development/DevProjectSprints';
import { DevProjectTimeTracking } from '@/components/development/DevProjectTimeTracking';
import { DevProjectBuilds } from '@/components/development/DevProjectBuilds';
import { DevProjectFiles } from '@/components/development/DevProjectFiles';

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
          {/* Top Navigation Bar */}
          <div className="sticky top-0 z-10 border-b bg-background">
            <div className="flex h-14 items-center gap-4 px-6">
              <SidebarTrigger />
              <Button variant="ghost" size="sm" onClick={() => navigate('/dev-projects')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </div>

            {/* Project Header */}
            <div className="border-t bg-muted/30">
              <div className="px-6 py-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Left: Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Code className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
                      <span className="text-sm text-muted-foreground">#{project.project_number}</span>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 max-w-3xl">
                      {project.description || 'No description provided'}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{getProjectTypeLabel(project.project_type)}</span>
                      </div>
                      
                      {project.start_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Started:</span>
                          <span className="font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Start Date: <span className="font-medium">Not set</span></span>
                        </div>
                      )}
                      
                      {project.target_launch_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-medium">{new Date(project.target_launch_date).toLocaleDateString()}</span>
                        </div>
                      )}

                      {(project.project_manager || project.lead_developer || project.client) && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            {project.project_manager && (
                              <span className="text-muted-foreground">PM: <span className="font-medium text-foreground">{project.project_manager.full_name}</span></span>
                            )}
                            {project.lead_developer && (
                              <>
                                {project.project_manager && <span className="text-muted-foreground">•</span>}
                                <span className="text-muted-foreground">Lead: <span className="font-medium text-foreground">{project.lead_developer.full_name}</span></span>
                              </>
                            )}
                            {project.client && (
                              <>
                                {(project.project_manager || project.lead_developer) && <span className="text-muted-foreground">•</span>}
                                <span className="text-muted-foreground">Client: <span className="font-medium text-foreground">{project.client.name}</span></span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status & Quick Links */}
                  <div className="flex items-start gap-3">
                    <Badge className={getStatusColor(project.status)} variant="secondary">
                      {project.status.replace(/_/g, ' ')}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      {project.repository_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                            <Code className="h-4 w-4 mr-2" />
                            Repository
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      
                      {(project.staging_url || project.production_url) && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.production_url || project.staging_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Live
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="sprints">Sprints</TabsTrigger>
                <TabsTrigger value="time">Time Tracking</TabsTrigger>
                <TabsTrigger value="builds">Builds</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <DevProjectOverview project={project} />
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-6">
                <DevProjectTasks projectId={project.id} />
              </TabsContent>
              
              <TabsContent value="sprints" className="mt-6">
                <DevProjectSprints projectId={project.id} />
              </TabsContent>
              
              <TabsContent value="time" className="mt-6">
                <DevProjectTimeTracking projectId={project.id} />
              </TabsContent>
              
              <TabsContent value="builds" className="mt-6">
                <DevProjectBuilds projectId={project.id} />
              </TabsContent>
              
              <TabsContent value="files" className="mt-6">
                <DevProjectFiles projectId={project.id} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DevProjectDetail;
