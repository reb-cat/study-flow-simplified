import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Play, Square, ExternalLink, Focus, Calendar } from 'lucide-react';
import { Header } from '@/components/Header';
import { GuidedDayView } from '@/components/GuidedDayView';
import { Assignment } from '@/types';
import { useAssignmentPlacement } from '@/hooks/useAssignmentPlacement';

const Dashboard = () => {
  const { 
    selectedProfile, 
    getAssignmentsForProfile, 
    getScheduleForStudent, 
    updateAssignment,
    startTimer,
    pauseTimer,
    activeTimer,
    currentUser 
  } = useApp();
  
  const { populateAssignmentBlocks } = useAssignmentPlacement();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showGuidedMode, setShowGuidedMode] = useState(false);

  if (!selectedProfile || !currentUser) {
    return <div>Loading...</div>;
  }

  // Get Monday of current week
  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const monday = getMonday(currentWeek);
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });

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

  const getAssignmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return profileAssignments.filter(a => a.scheduledDate === dateStr);
  };

  const getScheduleForDay = (date: Date) => {
    const weekday = date.getDay() === 0 ? 7 : date.getDay();
    return getScheduleForStudent(selectedProfile.displayName, weekday);
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentWeek(newWeek);
  };

  const getWeekRange = () => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Get today's date for guided mode
  const today = new Date().toISOString().split('T')[0];

  // Show guided mode if enabled
  if (showGuidedMode) {
    return <GuidedDayView onBackToHub={() => setShowGuidedMode(false)} selectedDate={today} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Week of {getWeekRange()}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Guided Mode Toggle */}
            <Button 
              onClick={() => setShowGuidedMode(true)}
              className="gap-2 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
            >
              <Focus className="w-4 h-4" />
              Start Guided Day
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
              Previous Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              Next Week
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {weekDays.map((day, dayIndex) => {
            const profileAssignments = getAssignmentsForProfile(selectedProfile.id);
            const daySchedule = getScheduleForDay(day);
            const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Populate assignment blocks using family detection
            const populatedBlocks = populateAssignmentBlocks(
              profileAssignments, 
              daySchedule, 
              selectedProfile.displayName, 
              dayName
            );
            
            return (
              <Card key={dayIndex} className="card-elevated h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">
                    {formatDate(day)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Schedule Blocks with Auto-Populated Assignments */}
                  {populatedBlocks.map((block) => (
                    <div key={block.id} className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        Block {block.blockNumber}: {block.startTime}–{block.endTime} • {block.subject}
                        {block.assignment && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {block.assignment.detectedFamily}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Assignment for this block */}
                      {block.assignment && (
                        <AssignmentCard
                          key={block.assignment.id}
                          assignment={block.assignment}
                          onToggleComplete={handleToggleComplete}
                          onStartTimer={handleStartTimer}
                          isTimerActive={isTimerActive(block.assignment.id)}
                          activeTimer={activeTimer}
                          formatTime={formatTime}
                          formatTimerTime={formatTimerTime}
                        />
                      )}
                      
                      {/* Empty state for blocks without assignments */}
                      {!block.assignment && block.blockType === 'assignment' && (
                        <div className="text-xs text-muted-foreground italic p-2 bg-muted/30 rounded">
                          No assignment scheduled
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Empty state */}
                  {populatedBlocks.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No schedule blocks
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Weekly Summary */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Week Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {profileAssignments.filter(a => {
                    if (!a.scheduledDate) return false;
                    const scheduled = new Date(a.scheduledDate);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).filter(a => a.completed).length}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-timer">
                  {profileAssignments.filter(a => {
                    if (!a.scheduledDate) return false;
                    const scheduled = new Date(a.scheduledDate);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).length}
                </div>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {formatTime(profileAssignments.filter(a => {
                    if (!a.scheduledDate) return false;
                    const scheduled = new Date(a.scheduledDate);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).reduce((total, a) => total + a.timeSpent, 0))}
                </div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
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
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onToggleComplete,
  onStartTimer,
  isTimerActive,
  activeTimer,
  formatTime,
  formatTimerTime
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
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
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

export default Dashboard;