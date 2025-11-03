import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailDialog } from './TaskDetailDialog';
import { useToast } from '@/hooks/use-toast';

interface DevProjectTasksProps {
  projectId: string;
}

export const DevProjectTasks = ({ projectId }: DevProjectTasksProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['dev-tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_tasks')
        .select(`
          *,
          assigned_to_profile:profiles!dev_tasks_assigned_to_fkey(full_name),
          created_by_profile:profiles!dev_tasks_created_by_fkey(full_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase
        .from('dev_tasks')
        .update({ status: status as any })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dev-tasks', projectId] });
      toast({ title: 'Task updated successfully' });
    },
  });

  const statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'blocked'];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      backlog: 'bg-gray-500/10 text-gray-500',
      todo: 'bg-blue-500/10 text-blue-500',
      in_progress: 'bg-purple-500/10 text-purple-500',
      in_review: 'bg-yellow-500/10 text-yellow-500',
      testing: 'bg-orange-500/10 text-orange-500',
      done: 'bg-green-500/10 text-green-500',
      blocked: 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500/10 text-gray-500',
      medium: 'bg-blue-500/10 text-blue-500',
      high: 'bg-orange-500/10 text-orange-500',
      urgent: 'bg-red-500/10 text-red-500',
    };
    return colors[priority] || 'bg-gray-500/10 text-gray-500';
  };

  const getTasksByStatus = (status: string) => {
    return tasks?.filter((task) => task.status === status) || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statuses.map((status) => (
          <div key={status} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium capitalize">{status.replace(/_/g, ' ')}</h4>
              <Badge variant="secondary" className="text-xs">
                {getTasksByStatus(status).length}
              </Badge>
            </div>
            <div className="space-y-2">
              {getTasksByStatus(status).map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTask(task)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {task.title}
                      </CardTitle>
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>#{task.task_number}</div>
                      {task.assigned_to_profile && (
                        <div>{task.assigned_to_profile.full_name}</div>
                      )}
                      {task.story_points && (
                        <Badge variant="outline" className="text-xs">
                          {task.story_points} pts
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
      />

      {selectedTask && (
        <TaskDetailDialog
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          task={selectedTask}
          onStatusChange={(status) => updateTaskStatus.mutate({ taskId: selectedTask.id, status })}
        />
      )}
    </div>
  );
};
