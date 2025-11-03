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
