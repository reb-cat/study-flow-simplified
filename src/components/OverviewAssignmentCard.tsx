import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Circle, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { UnifiedAssignment } from '@/types/assignment';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';

interface OverviewAssignmentCardProps {
  block: SupabaseScheduleBlock;
  assignment?: UnifiedAssignment;
  formatTime: (minutes: number) => string;
}

const getStatusIcon = (assignment?: UnifiedAssignment, block?: SupabaseScheduleBlock) => {
  if (!assignment) {
    // No assignment - show open circle
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  }

  if (assignment.completed_at) {
    // Completed - show check circle
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  }

  // TODO: Add logic for "need more time" and "stuck" based on guided day data
  // For now, just show open circle for incomplete assignments
  return <Circle className="w-4 h-4 text-blue-500" />;
};

export const OverviewAssignmentCard: React.FC<OverviewAssignmentCardProps> = ({
  block,
  assignment,
  formatTime
}) => {
  const isAssignmentBlock = block.block_type === 'assignment' || block.block_type === 'study hall';

  if (!isAssignmentBlock) {
    // Non-assignment blocks (breaks, co-op, etc.)
    return (
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-muted-foreground">
                {block.start_time} • {block.subject || block.block_name}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(assignment, block)}
            <div>
              <div className="text-sm font-medium text-foreground">
                {block.start_time} • {assignment ? 'Assignment' : block.subject}
              </div>
              {assignment && (
                <div className="text-xs text-muted-foreground mt-1">
                  {assignment.title}
                </div>
              )}
              {assignment && assignment.subject && (
                <div className="text-xs text-muted-foreground">
                  {assignment.subject}
                  {assignment.due_date && (
                    <span className="ml-2">
                      Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { 
                        month: 'numeric', 
                        day: 'numeric' 
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {assignment && assignment.time_spent && assignment.time_spent > 0 && (
            <div className="text-xs text-muted-foreground">
              {formatTime(assignment.time_spent)} spent
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};