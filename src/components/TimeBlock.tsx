import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Square, ExternalLink, Plus } from 'lucide-react';
import { ScheduleBlock } from '@/hooks/useDaySchedule';

interface TimeBlockProps {
  block: ScheduleBlock;
  onToggleComplete?: (assignmentId: string) => void;
  onStartTimer?: (assignmentId: string) => void;
  onAddAssignment?: (blockNumber: number) => void;
  isTimerActive?: boolean;
  activeTimer?: any;
  formatTime?: (minutes: number) => string;
  formatTimerTime?: (seconds: number) => string;
  showAddButton?: boolean;
}

export const TimeBlock: React.FC<TimeBlockProps> = ({
  block,
  onToggleComplete,
  onStartTimer,
  onAddAssignment,
  isTimerActive = false,
  activeTimer,
  formatTime = (mins) => `${mins}m`,
  formatTimerTime = (secs) => `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2, '0')}`,
  showAddButton = false
}) => {
  const getBlockTypeColor = () => {
    switch (block.blockType) {
      case 'co-op': return 'bg-blue-50 border-blue-200';
      case 'break': return 'bg-gray-50 border-gray-200';
      case 'bible': return 'bg-purple-50 border-purple-200';
      case 'lunch': return 'bg-green-50 border-green-200';
      default: return 'bg-card border-border';
    }
  };

  const getStatusBadge = () => {
    if (!block.assignment) return null;
    
    if (block.assignment.completed) {
      return <Badge className="status-done">Done</Badge>;
    }
    if (isTimerActive) {
      return <Badge className="status-timer">Timer Running</Badge>;
    }
    return <Badge className="status-todo">To-Do</Badge>;
  };

  return (
    <Card className={`${getBlockTypeColor()} transition-colors duration-200`}>
      <CardContent className="p-3">
        {/* Time Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-muted-foreground">
            {block.startTime} - {block.endTime}
          </div>
          {getStatusBadge()}
        </div>

        {/* Fixed Block Content */}
        {block.isFixed && (
          <div className="text-center py-2">
            <div className="font-medium text-sm">{block.subject}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {block.blockType}
            </div>
          </div>
        )}

        {/* Assignment Block Content */}
        {!block.isFixed && block.assignment && (
          <div className="space-y-2">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{block.assignment.title}</h4>
              <p className="text-xs text-muted-foreground">{block.assignment.subject}</p>
              {block.assignment.dueDate && (
                <p className="text-xs text-muted-foreground">
                  Due: {new Date(block.assignment.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={block.assignment.completed}
                  onCheckedChange={() => onToggleComplete?.(block.assignment!.id)}
                />
                <span className="text-xs text-muted-foreground">
                  {isTimerActive && activeTimer ? 
                    formatTimerTime(activeTimer.elapsedTime) : 
                    formatTime(block.assignment.timeSpent)
                  } spent
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={isTimerActive ? "destructive" : "outline"}
                  onClick={() => onStartTimer?.(block.assignment!.id)}
                  className="h-6 px-2"
                >
                  {isTimerActive ? (
                    <Square className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>

                {block.assignment.canvasUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="h-6 px-2"
                  >
                    <a href={block.assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Open Block Content */}
        {block.isOpen && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground mb-2">
              Open Assignment Block
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Subject: {block.subject}
            </div>
            {showAddButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddAssignment?.(block.blockNumber)}
                className="h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Assignment
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};