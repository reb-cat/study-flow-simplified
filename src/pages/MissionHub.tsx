import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Play, Pause, Square, ExternalLink } from 'lucide-react';
import { Assignment, ScheduleTemplate } from '@/types';
import { format, addDays } from 'date-fns';

const MissionHub = () => {
  const { 
    selectedProfile, 
    getAssignmentsForProfile, 
    getScheduleForStudent, 
    updateAssignment,
    startTimer,
    pauseTimer,
    stopTimer,
    activeTimer
  } = useApp();

  if (!selectedProfile) {
    return <div>Loading...</div>;
  }

  // Work-ahead filtering logic
  const getRelevantAssignments = (assignments: Assignment[], currentDate: Date) => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    
    // Work-ahead window: Today + 5 school days
    const workAheadDays = 5;
    const workAheadDate = new Date(today);
    
    // Add 5 school days (skip weekends)
    let daysAdded = 0;
    while (daysAdded < workAheadDays) {
      workAheadDate.setDate(workAheadDate.getDate() + 1);
      const dayOfWeek = workAheadDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sunday(0) and Saturday(6)
        daysAdded++;
      }
    }
    
    return assignments.filter(assignment => {
      // Hide completed
      if (assignment.completed) return false;
      
      // No due date = hide
      if (!assignment.dueDate) return false;
      
      const dueDate = new Date(assignment.dueDate);
      
      // Show if due within the work-ahead window
      return dueDate <= workAheadDate;
    });
  };

  // Categorize by urgency
  const categorizeByUrgency = (filteredAssignments: Assignment[], currentDate: Date) => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const threeDaysOut = new Date(today);
    threeDaysOut.setDate(today.getDate() + 3);
    
    return {
      overdue: filteredAssignments.filter(a => 
        new Date(a.dueDate!) < today
      ),
      urgent: filteredAssignments.filter(a => {
        const due = new Date(a.dueDate!);
        return due >= today && due <= tomorrow;
      }),
      thisWeek: filteredAssignments.filter(a => {
        const due = new Date(a.dueDate!);
        return due > tomorrow && due <= threeDaysOut;
      }),
      upcoming: filteredAssignments.filter(a => {
        const due = new Date(a.dueDate!);
        return due > threeDaysOut;
      })
    };
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'numeric', 
      day: 'numeric' 
    });
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

  const profileAssignments = getAssignmentsForProfile(selectedProfile.id);
  const currentDate = new Date();
  const relevantAssignments = getRelevantAssignments(profileAssignments, currentDate);
  const categorizedAssignments = categorizeByUrgency(relevantAssignments, currentDate);

  // Calculate work-ahead date for display
  const getWorkAheadDate = () => {
    const today = new Date();
    const workAheadDate = new Date(today);
    let daysAdded = 0;
    while (daysAdded < 5) {
      workAheadDate.setDate(workAheadDate.getDate() + 1);
      const dayOfWeek = workAheadDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }
    return workAheadDate;
  };

  const handleToggleComplete = (assignment: Assignment) => {
    updateAssignment(assignment.id, { completed: !assignment.completed });
  };

  const handleStartTimer = (assignmentId: string) => {
    if (activeTimer?.assignmentId === assignmentId) {
      pauseTimer();
    } else {
      startTimer(assignmentId, selectedProfile.id);
    }
  };

  const isTimerActive = (assignmentId: string) => {
    return activeTimer?.assignmentId === assignmentId;
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mission Hub</h1>
          <p className="text-muted-foreground">Work-ahead assignments for {selectedProfile.displayName}</p>
        </div>

        {/* Work-ahead messaging */}
        <Alert>
          <AlertDescription>
            📚 Showing work due through {format(getWorkAheadDate(), 'EEEE, MMM d')}
            <br />
            Monday assignments should be done by Friday!
          </AlertDescription>
        </Alert>

        {/* No assignments message */}
        {relevantAssignments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">🎉 No assignments due in the next 5 school days!</p>
            </CardContent>
          </Card>
        )}

        {/* Overdue Section */}
        {categorizedAssignments.overdue.length > 0 && (
          <UrgencySection
            title="🔴 OVERDUE - Do First!"
            urgency="critical"
            assignments={categorizedAssignments.overdue}
            onToggleComplete={handleToggleComplete}
            onStartTimer={handleStartTimer}
            isTimerActive={isTimerActive}
            activeTimer={activeTimer}
            formatTime={formatTime}
            formatTimerTime={formatTimerTime}
            getDaysUntilDue={getDaysUntilDue}
          />
        )}

        {/* Urgent Section */}
        {categorizedAssignments.urgent.length > 0 && (
          <UrgencySection
            title="🟡 Due Today/Tomorrow - Priority"
            urgency="high"
            assignments={categorizedAssignments.urgent}
            onToggleComplete={handleToggleComplete}
            onStartTimer={handleStartTimer}
            isTimerActive={isTimerActive}
            activeTimer={activeTimer}
            formatTime={formatTime}
            formatTimerTime={formatTimerTime}
            getDaysUntilDue={getDaysUntilDue}
          />
        )}

        {/* This Week Section */}
        {categorizedAssignments.thisWeek.length > 0 && (
          <UrgencySection
            title="🟢 Due in 2-3 Days - Schedule These"
            urgency="medium"
            assignments={categorizedAssignments.thisWeek}
            onToggleComplete={handleToggleComplete}
            onStartTimer={handleStartTimer}
            isTimerActive={isTimerActive}
            activeTimer={activeTimer}
            formatTime={formatTime}
            formatTimerTime={formatTimerTime}
            getDaysUntilDue={getDaysUntilDue}
            showDaysUntilDue={true}
          />
        )}

        {/* Upcoming Section */}
        {categorizedAssignments.upcoming.length > 0 && (
          <UrgencySection
            title="🔵 Due in 4-5 Days - Start Planning"
            urgency="low"
            assignments={categorizedAssignments.upcoming}
            onToggleComplete={handleToggleComplete}
            onStartTimer={handleStartTimer}
            isTimerActive={isTimerActive}
            activeTimer={activeTimer}
            formatTime={formatTime}
            formatTimerTime={formatTimerTime}
            getDaysUntilDue={getDaysUntilDue}
            showDaysUntilDue={true}
            note="Remember: If due Monday, finish by Friday!"
          />
        )}
      </main>
    </div>
  );
};

interface UrgencySectionProps {
  title: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  assignments: Assignment[];
  onToggleComplete: (assignment: Assignment) => void;
  onStartTimer: (assignmentId: string) => void;
  isTimerActive: (assignmentId: string) => boolean;
  activeTimer: any;
  formatTime: (minutes: number) => string;
  formatTimerTime: (seconds: number) => string;
  getDaysUntilDue: (dueDate: string) => string;
  showDaysUntilDue?: boolean;
  note?: string;
}

const UrgencySection: React.FC<UrgencySectionProps> = ({
  title,
  urgency,
  assignments,
  onToggleComplete,
  onStartTimer,
  isTimerActive,
  activeTimer,
  formatTime,
  formatTimerTime,
  getDaysUntilDue,
  showDaysUntilDue = false,
  note
}) => {
  const getBorderColor = () => {
    switch (urgency) {
      case 'critical': return 'border-red-500';
      case 'high': return 'border-yellow-500';
      case 'medium': return 'border-green-500';
      case 'low': return 'border-blue-500';
      default: return 'border-border';
    }
  };

  return (
    <Card className={`${getBorderColor()} border-l-4`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {note && <span className="text-sm font-normal text-muted-foreground">{note}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignments.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onToggleComplete={onToggleComplete}
              onStartTimer={onStartTimer}
              isTimerActive={isTimerActive(assignment.id)}
              activeTimer={activeTimer}
              formatTime={formatTime}
              formatTimerTime={formatTimerTime}
              getDaysUntilDue={getDaysUntilDue}
              showDaysUntilDue={showDaysUntilDue}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface AssignmentCardProps {
  assignment: Assignment;
  onToggleComplete: (assignment: Assignment) => void;
  onStartTimer: (assignmentId: string) => void;
  isTimerActive: boolean;
  activeTimer: any;
  formatTime: (minutes: number) => string;
  formatTimerTime: (seconds: number) => string;
  getDaysUntilDue: (dueDate: string) => string;
  showDaysUntilDue?: boolean;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onToggleComplete,
  onStartTimer,
  isTimerActive,
  activeTimer,
  formatTime,
  formatTimerTime,
  getDaysUntilDue,
  showDaysUntilDue = false
}) => {
  const getStatusBadge = () => {
    if (assignment.completed) {
      return <Badge className="status-done">Done</Badge>;
    }
    if (isTimerActive) {
      return <Badge className="status-timer">Timer Running</Badge>;
    }
    return <Badge className="status-todo">To-Do</Badge>;
  };

  return (
    <Card className={`p-3 space-y-3 ${
      assignment.completed ? 'bg-success-light/10 border-success/20' : 
      isTimerActive ? 'bg-timer-light/10 border-timer/20' : 
      'bg-card border-border'
    }`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{assignment.title}</h4>
            <p className="text-xs text-muted-foreground">{assignment.subject}</p>
            {assignment.dueDate && (
              <p className="text-xs text-muted-foreground">
                {showDaysUntilDue ? getDaysUntilDue(assignment.dueDate) : `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
              </p>
            )}
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={assignment.completed}
              onCheckedChange={() => onToggleComplete(assignment)}
            />
            <span className="text-xs text-muted-foreground">
              {isTimerActive && activeTimer ? 
                formatTimerTime(activeTimer.elapsedTime) : 
                formatTime(assignment.timeSpent)
              } spent
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={isTimerActive ? "destructive" : "outline"}
              onClick={() => onStartTimer(assignment.id)}
              className="h-6 px-2"
            >
              {isTimerActive ? (
                <Square className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </Button>

            {assignment.canvasUrl && (
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="h-6 px-2"
              >
                <a href={assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MissionHub;