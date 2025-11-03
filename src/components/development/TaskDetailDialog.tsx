import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onStatusChange: (status: string) => void;
}

export const TaskDetailDialog = ({ open, onOpenChange, task, onStatusChange }: TaskDetailDialogProps) => {
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500/10 text-gray-500',
      medium: 'bg-blue-500/10 text-blue-500',
      high: 'bg-orange-500/10 text-orange-500',
      urgent: 'bg-red-500/10 text-red-500',
    };
    return colors[priority] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Task #{task.task_number}</p>
            </div>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={task.status} onValueChange={onStatusChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {task.description && (
            <div>
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {task.task_type}
              </p>
            </div>
            {task.assigned_to_profile && (
              <div>
                <label className="text-sm font-medium">Assigned To</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {task.assigned_to_profile.full_name}
                </p>
              </div>
            )}
            {task.story_points && (
              <div>
                <label className="text-sm font-medium">Story Points</label>
                <p className="text-sm text-muted-foreground mt-1">{task.story_points}</p>
              </div>
            )}
            {task.estimated_hours && (
              <div>
                <label className="text-sm font-medium">Estimated Hours</label>
                <p className="text-sm text-muted-foreground mt-1">{task.estimated_hours}h</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Actual Hours</label>
              <p className="text-sm text-muted-foreground mt-1">{task.actual_hours || 0}h</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
