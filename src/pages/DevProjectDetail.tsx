import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code, Loader2, ExternalLink, FileText, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DevProjectOverview } from '@/components/development/DevProjectOverview';
import { DevProjectTasks } from '@/components/development/DevProjectTasks';
import { DevProjectSprints } from '@/components/development/DevProjectSprints';
import { DevProjectTimeTracking } from '@/components/development/DevProjectTimeTracking';
import { DevProjectBuilds } from '@/components/development/DevProjectBuilds';
import { DevProjectFiles } from '@/components/development/DevProjectFiles';

const DevProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});

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

  const updateProject = async (field: string, value: any) => {
    try {
      // Validate input based on field
      if (field === 'name') {
        const nameSchema = z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters");
        const result = nameSchema.safeParse(value);
        if (!result.success) {
          toast({
            title: "Validation error",
            description: result.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      } else if (field === 'description') {
        const descSchema = z.string().max(2000, "Description must be less than 2000 characters");
        const result = descSchema.safeParse(value);
        if (!result.success) {
          toast({
            title: "Validation error",
            description: result.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      } else if (field === 'repository_url' || field === 'production_url') {
        if (value) {
          const urlSchema = z.string().url("Invalid URL");
          const result = urlSchema.safeParse(value);
          if (!result.success) {
            toast({
              title: "Validation error",
              description: result.error.errors[0].message,
              variant: "destructive",
            });
            return;
          }
        }
      }

      const { error } = await supabase
        .from('dev_projects')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['dev-project', id] });
      toast({
        title: "Project updated",
        description: "Changes saved successfully",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
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
              <div className="px-6 py-6 space-y-4">
                {/* Project Name */}
                <div className="flex items-center gap-3">
                  <Code className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  <Input
                    defaultValue={project.name}
                    className="text-3xl font-semibold tracking-tight border-0 shadow-none focus-visible:ring-0 px-2 -mx-2 h-auto py-1"
                    onBlur={(e) => {
                      if (e.target.value !== project.name && e.target.value.trim()) {
                        updateProject('name', e.target.value.trim());
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">#{project.project_number}</span>
                  <Badge className={getStatusColor(project.status)} variant="secondary">
                    {project.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Description */}
                <Textarea
                  defaultValue={project.description || ''}
                  placeholder="Add project description..."
                  className="text-muted-foreground resize-none border-0 shadow-none focus-visible:ring-0 px-2 -mx-2 min-h-[60px]"
                  onBlur={(e) => {
                    if (e.target.value !== project.description) {
                      updateProject('description', e.target.value.trim());
                    }
                  }}
                />

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Start Date
                    </label>
                    <Input
                      type="date"
                      defaultValue={project.start_date?.split('T')[0] || ''}
                      className="h-8 text-sm"
                      onBlur={(e) => {
                        if (e.target.value) {
                          updateProject('start_date', new Date(e.target.value).toISOString());
                        }
                      }}
                    />
                  </div>

                  {/* Target Launch Date */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Target Launch
                    </label>
                    <Input
                      type="date"
                      defaultValue={project.target_launch_date?.split('T')[0] || ''}
                      className="h-8 text-sm"
                      onBlur={(e) => {
                        if (e.target.value) {
                          updateProject('target_launch_date', new Date(e.target.value).toISOString());
                        }
                      }}
                    />
                  </div>

                  {/* Repository URL */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      Repository URL
                    </label>
                    <div className="flex gap-1">
                      <Input
                        type="url"
                        placeholder="https://github.com/..."
                        defaultValue={project.repository_url || ''}
                        className="h-8 text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== project.repository_url) {
                            updateProject('repository_url', e.target.value.trim() || null);
                          }
                        }}
                      />
                      {project.repository_url && (
                        <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                          <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Production URL */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Live URL
                    </label>
                    <div className="flex gap-1">
                      <Input
                        type="url"
                        placeholder="https://..."
                        defaultValue={project.production_url || ''}
                        className="h-8 text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== project.production_url) {
                            updateProject('production_url', e.target.value.trim() || null);
                          }
                        }}
                      />
                      {project.production_url && (
                        <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                          <a href={project.production_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
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
