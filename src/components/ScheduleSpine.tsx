import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeBlock } from './TimeBlock';
import { useDaySchedule } from '@/hooks/useDaySchedule';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';

interface ScheduleSpineProps {
  studentName: string;
  date: Date;
  showAddButtons?: boolean;
}

export const ScheduleSpine: React.FC<ScheduleSpineProps> = ({
  studentName,
  date,
  showAddButtons = false
}) => {
  const schedule = useDaySchedule(studentName, date);
  const { 
    updateAssignment, 
    startTimer, 
    activeTimer,
    selectedProfile 
  } = useApp();

  const handleToggleComplete = (assignmentId: string) => {
    updateAssignment(assignmentId, { completed: true });
  };

  const handleStartTimer = (assignmentId: string) => {
    if (selectedProfile) {
      startTimer(assignmentId, selectedProfile.id);
    }
  };

  const handleAddAssignment = (blockNumber: number) => {
    // This would open a modal or navigate to assignment creation
    console.log('Add assignment to block', blockNumber);
  };

  const isTimerActive = (assignmentId: string) => {
    return activeTimer?.assignmentId === assignmentId;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (schedule.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No schedule template found for this day</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {format(date, 'EEEE, MMM d')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.map((block) => (
          <TimeBlock
            key={block.id}
            block={block}
            onToggleComplete={handleToggleComplete}
            onStartTimer={handleStartTimer}
            onAddAssignment={handleAddAssignment}
            isTimerActive={block.assignment ? isTimerActive(block.assignment.id) : false}
            activeTimer={activeTimer}
            formatTime={formatTime}
            formatTimerTime={formatTimerTime}
            showAddButton={showAddButtons}
          />
        ))}
      </CardContent>
    </Card>
  );
};