import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertTriangle, Timer, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { Assignment } from '@/types';

interface OverviewBlockProps {
  assignment: Assignment;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignmentId: string) => void;
  onStartTimer?: (assignmentId: string) => void;
  onMarkStatus?: (
    assignmentId: string,
    status: 'completed' | 'pending' | 'stuck' | 'needs_more_time'
  ) => void;
}

export function OverviewBlock({
  assignment,
  onEdit,
  onDelete,
  onStartTimer,
  onMarkStatus,
}: OverviewBlockProps) {
  const statusConfig = {
    pending: { 
      label: 'Not Started', 
      color: 'bg-muted text-muted-foreground border-muted', 
      icon: Clock 
    },
    in_progress: { 
      label: 'In Progress', 
      color: 'bg-primary/10 text-primary border-primary/20', 
      icon: Clock 
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-success/10 text-success border-success/20', 
      icon: CheckCircle 
    },
    stuck: { 
      label: 'Need Help', 
      color: 'bg-destructive/10 text-destructive border-destructive/20', 
      icon: AlertTriangle 
    },
    needs_more_time: { 
      label: 'Need More Time', 
      color: 'bg-timer/10 text-timer border-timer/20', 
      icon: Clock 
    }
  };

  // Use 'pending' as fallback for assignments that don't have completionStatus
  const currentStatus = assignment.completed ? 'completed' : 'pending';
  const status = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const handleStatusUpdate = (
    newStatus: 'completed' | 'pending' | 'stuck' | 'needs_more_time'
  ) => {
    if (!onMarkStatus) return;
    onMarkStatus(assignment.id, newStatus);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const estimatedMinutes = 30; // Default estimate
  const progressPercentage = assignment.timeSpent > 0 ? Math.min((assignment.timeSpent / estimatedMinutes) * 100, 100) : 0;

  return (
    <Card className="bg-card border border-border hover:shadow-sm transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>{estimatedMinutes} min</span>
              {assignment.subject && (
                <>
                  <span>•</span>
                  <span>{assignment.subject}</span>
                </>
              )}
              {assignment.dueDate && (
                <>
                  <span>•</span>
                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                </>
              )}
            </div>
            <h3 className="font-semibold text-foreground text-lg leading-tight">
              {assignment.title}
            </h3>
            {assignment.timeSpent > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                  <span>Time spent: {formatTime(assignment.timeSpent)}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </div>
          <Badge className={`${status.color} ml-4 flex items-center gap-1 px-3 py-1`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>

        {/* Action buttons for non-completed assignments */}
        {!assignment.completed && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              size="sm"
              onClick={() => handleStatusUpdate('completed')}
              className="flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle className="h-4 w-4" />
              Mark Done
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartTimer?.(assignment.id)}
              className="flex items-center gap-2"
            >
              <Timer className="h-4 w-4" />
              Start Timer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('needs_more_time')}
              className="flex items-center gap-2 text-timer border-timer/20 hover:bg-timer/5"
            >
              <Clock className="h-4 w-4" />
              More Time
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('stuck')}
              className="flex items-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              <AlertTriangle className="h-4 w-4" />
              Need Help
            </Button>
          </div>
        )}

        {/* Completion celebration */}
        {assignment.completed && (
          <div className="flex items-center gap-2 text-success text-sm font-medium mb-4 p-3 bg-success/5 rounded-lg border border-success/10">
            <CheckCircle className="h-5 w-5" />
            <span>Completed! Great work! 🎉</span>
          </div>
        )}

        {/* Management actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {assignment.canvasUrl && (
              <Button size="sm" variant="ghost" asChild>
                <a href={assignment.canvasUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  Canvas
                </a>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit?.(assignment)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete?.(assignment.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}