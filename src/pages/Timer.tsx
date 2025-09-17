import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Timer = () => {
  const { 
    activeTimer, 
    assignments, 
    selectedProfile,
    startTimer,
    pauseTimer, 
    stopTimer,
    updateAssignment
  } = useApp();
  const navigate = useNavigate();

  if (!activeTimer || !selectedProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-6 max-w-4xl mx-auto">
          <Card className="card-elevated text-center p-12">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">No Active Timer</h2>
              <p className="text-muted-foreground mb-6">
                Start a timer from your assignments or Mission Hub to track your work time.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/hub')}>
                  Go to Mission Hub
                </Button>
                <Button variant="outline" onClick={() => navigate('/assignments')}>
                  View Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const assignment = assignments.find(a => a.id === activeTimer.assignmentId);
  
  if (!assignment) {
    return <div>Assignment not found</div>;
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate progress based on estimated time (using a default of 60 minutes if no target)
  const targetMinutes = 60; // Could be added to assignment model later
  const totalSeconds = assignment.timeSpent * 60 + activeTimer.elapsedTime;
  const progressPercentage = Math.min((totalSeconds / (targetMinutes * 60)) * 100, 100);

  const handlePause = () => {
    pauseTimer();
    toast({ title: 'Timer paused' });
  };

  const handleStop = () => {
    stopTimer();
    toast({ title: 'Timer stopped and time saved' });
    navigate('/hub');
  };

  const handleMarkComplete = () => {
    updateAssignment(assignment.id, { completed: true });
    stopTimer();
    toast({ title: 'Assignment marked as complete!' });
    navigate('/dashboard');
  };

  const handleResume = () => {
    startTimer(assignment.id, selectedProfile.id);
    toast({ title: 'Timer resumed' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/hub')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timer</h1>
            <p className="text-muted-foreground">Focus time for your assignment</p>
          </div>
        </div>

        {/* Main Timer Display */}
        <Card className="card-elevated bg-gradient-timer text-timer-foreground">
          <CardContent className="p-12 text-center">
            {/* Timer Circle */}
            <div className="relative mx-auto mb-8 w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="opacity-20"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-mono font-bold">
                  {formatTime(activeTimer.elapsedTime)}
                </div>
                <div className="text-sm opacity-80">elapsed</div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <Button
                size="lg"
                variant="outline"
                onClick={handlePause}
                className="bg-timer-foreground text-timer hover:bg-timer-foreground/90"
              >
                <Pause className="w-5 h-5" />
                Pause
              </Button>
              
              <Button
                size="lg"
                variant="outline" 
                onClick={handleStop}
                className="bg-timer-foreground text-timer hover:bg-timer-foreground/90"
              >
                <Square className="w-5 h-5" />
                Stop
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm opacity-80">
                {Math.round(progressPercentage)}% of estimated {targetMinutes} minutes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Details */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{assignment.title}</CardTitle>
                <p className="text-muted-foreground mt-1">{assignment.subject}</p>
              </div>
              <Badge className={assignment.completed ? 'status-done' : 'status-timer'}>
                {assignment.completed ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatMinutes(assignment.timeSpent)}
                </div>
                <p className="text-sm text-muted-foreground">Previous Time</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-timer">
                  {formatMinutes(Math.floor(activeTimer.elapsedTime / 60))}
                </div>
                <p className="text-sm text-muted-foreground">Current Session</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {formatMinutes(assignment.timeSpent + Math.floor(activeTimer.elapsedTime / 60))}
                </div>
                <p className="text-sm text-muted-foreground">Total Time</p>
              </div>
            </div>

            {assignment.dueDate && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {!assignment.completed && (
            <Button 
              size="lg" 
              onClick={handleMarkComplete}
              className="gap-2 bg-success text-success-foreground hover:bg-success/90"
            >
              <CheckCircle className="w-5 h-5" />
              Mark Complete
            </Button>
          )}
          
          <Button variant="outline" size="lg" onClick={() => navigate('/assignments')}>
            View All Assignments
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Timer;