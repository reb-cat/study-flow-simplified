import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleBlockDisplay } from '@/components/ScheduleBlockDisplay';
import { useAssignmentPlacement } from '@/hooks/useAssignmentPlacement';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { SupabaseAssignment } from '@/hooks/useSupabaseAssignments';
import { useScheduleCache } from '@/hooks/useScheduleCache';

interface DayScheduleCardProps {
  day: Date;
  dayIndex: number;
  selectedProfile: any;
  assignments: SupabaseAssignment[];
  // Removed getScheduleForDay - now using cached version
  formatDate: (date: Date) => string;
  handleToggleComplete: (assignment: any) => void;
  handleStartTimer: (assignmentId: string) => void;
  isTimerActive: (assignmentId: string) => boolean;
  formatTime: (minutes: number) => string;
  formatTimerTime: (seconds: number) => string;
  getDayName: (date: Date) => string;
}

export function DayScheduleCard({ 
  day, 
  dayIndex, 
  selectedProfile, 
  assignments, 
  formatDate,
  handleToggleComplete,
  handleStartTimer,
  isTimerActive,
  formatTime,
  formatTimerTime,
  getDayName
}: DayScheduleCardProps) {
  const [scheduleBlocks, setScheduleBlocks] = useState<SupabaseScheduleBlock[]>([]);
  const { getCachedScheduleForDay, isLoading, error } = useScheduleCache();

  // Fetch schedule data for this day with caching
  useEffect(() => {
    const fetchSchedule = async () => {
      const dayName = getDayName(day);
      const blocks = await getCachedScheduleForDay(selectedProfile.displayName, dayName);
      setScheduleBlocks(blocks);
    };

    fetchSchedule();
  }, [day, selectedProfile.displayName, getCachedScheduleForDay, getDayName]);

  const dateStr = day.toISOString().split('T')[0];
  const dayAssignments = assignments.filter(a => a.scheduled_date === dateStr);

  const { populatedBlocks } = useAssignmentPlacement(
    assignments,
    scheduleBlocks,
    selectedProfile.displayName,
    dateStr
  );

  if (isLoading) {
    return (
      <Card className="card-elevated h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {formatDate(day)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading schedule...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-elevated h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {formatDate(day)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-8">
            <p className="text-sm">Failed to load schedule</p>
            <p className="text-xs text-muted-foreground mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          {formatDate(day)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Schedule Blocks - USE EXACT DATABASE DATA */}
        {scheduleBlocks.map((block) => {
          const populatedBlock = populatedBlocks.find(p => p.id === block.id);
          
          return (
            <ScheduleBlockDisplay 
              key={block.id} 
              block={block}
              assignedFamily={populatedBlock?.assignedFamily}
            >
              {/* Auto-populated assignments */}
              {populatedBlock?.assignment && (
                <AssignmentCard
                  assignment={populatedBlock.assignment}
                  onToggleComplete={handleToggleComplete}
                  onStartTimer={handleStartTimer}
                  isTimerActive={isTimerActive(populatedBlock.assignment.id)}
                  formatTime={formatTime}
                  formatTimerTime={formatTimerTime}
                />
              )}
              
              {/* Manually scheduled assignments for this block */}
              {dayAssignments
                .filter(a => a.scheduled_block === block.block_number && !populatedBlock?.assignment)
                .map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onToggleComplete={handleToggleComplete}
                    onStartTimer={handleStartTimer}
                    isTimerActive={isTimerActive(assignment.id)}
                    formatTime={formatTime}
                    formatTimerTime={formatTimerTime}
                  />
                ))}
            </ScheduleBlockDisplay>
          );
        })}

        {/* Empty state */}
        {scheduleBlocks.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            No schedule blocks found
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified Assignment Card for Supabase data
interface AssignmentCardProps {
  assignment: SupabaseAssignment | any; // Allow flexibility for now
  onToggleComplete: (assignment: any) => void;
  onStartTimer: (assignmentId: string) => void;
  isTimerActive: boolean;
  formatTime: (minutes: number) => string;
  formatTimerTime: (seconds: number) => string;
}

function AssignmentCard({
  assignment,
  onToggleComplete,
  onStartTimer,
  isTimerActive,
  formatTime,
  formatTimerTime
}: AssignmentCardProps) {
  const isCompleted = !!assignment.completed_at || !!assignment.completed;

  return (
    <Card className={`p-3 space-y-2 ${
      isCompleted ? 'bg-success-light/10 border-success/20' : 
      isTimerActive ? 'bg-timer-light/10 border-timer/20' : 
      'bg-card border-border'
    }`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{assignment.title}</h4>
            <p className="text-xs text-muted-foreground">{assignment.subject || assignment.course_name}</p>
            {(assignment.due_date || assignment.dueDate) && (
              <p className="text-xs text-muted-foreground">
                Due: {new Date(assignment.due_date || assignment.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-xs">
            {isCompleted ? 'Done' : 'To-Do'}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button 
            onClick={() => onToggleComplete(assignment)}
            className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
          >
            {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <span className="text-muted-foreground">
            {formatTime(assignment.time_spent || assignment.timeSpent || 0)} spent
          </span>
          {(assignment.canvas_url || assignment.canvasUrl) && (
            <a 
              href={assignment.canvas_url || assignment.canvasUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Canvas
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}