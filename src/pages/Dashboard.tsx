import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, Target, Timer, BookOpen, ExternalLink } from 'lucide-react';
import { Header } from '@/components/Header';

const Dashboard = () => {
  const { 
    selectedProfile, 
    getAssignmentsForProfile, 
    activeTimer, 
    assignments, 
    currentUser 
  } = useApp();
  const navigate = useNavigate();

  if (!selectedProfile || !currentUser) {
    return <div>Loading...</div>;
  }

  const profileAssignments = getAssignmentsForProfile(selectedProfile.id);
  const completedAssignments = profileAssignments.filter(a => a.completed);
  const totalTimeSpent = profileAssignments.reduce((total, a) => total + a.timeSpent, 0);
  const avgTimePerAssignment = profileAssignments.length > 0 ? totalTimeSpent / profileAssignments.length : 0;

  // This week's assignments (simplified for demo)
  const thisWeekAssignments = profileAssignments.filter(a => {
    if (!a.scheduledDate) return false;
    const scheduled = new Date(a.scheduledDate);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    return scheduled >= weekStart && scheduled <= weekEnd;
  });

  const thisWeekCompleted = thisWeekAssignments.filter(a => a.completed);
  const completionPercentage = thisWeekAssignments.length > 0 
    ? (thisWeekCompleted.length / thisWeekAssignments.length) * 100 
    : 0;

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

  const activeAssignment = activeTimer 
    ? assignments.find(a => a.id === activeTimer.assignmentId)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {selectedProfile.displayName}!
          </h1>
          <p className="text-muted-foreground">
            Here's your learning progress and active work
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week's Assignments</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisWeekCompleted.length}/{thisWeekAssignments.length}</div>
              <Progress value={completionPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(completionPercentage)}% complete
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(thisWeekAssignments.reduce((total, a) => total + a.timeSpent, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatTime(Math.round(avgTimePerAssignment))} per assignment
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedAssignments.length}</div>
              <p className="text-xs text-muted-foreground">
                Out of {profileAssignments.length} assignments
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 days</div>
              <p className="text-xs text-muted-foreground">
                Keep it up! 🔥
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Timer Section */}
        {activeTimer && activeAssignment && (
          <Card className="card-elevated border-timer/20 bg-timer-light/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-timer rounded-full animate-pulse" />
                    Active Timer
                  </CardTitle>
                  <CardDescription>Currently working on assignment</CardDescription>
                </div>
                <Badge className="status-timer">Running</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{activeAssignment.title}</h3>
                  <p className="text-sm text-muted-foreground">{activeAssignment.subject}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold">
                    {formatTimerTime(activeTimer.elapsedTime)}
                  </div>
                  <p className="text-sm text-muted-foreground">elapsed</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => navigate('/timer')}>
                  Go to Timer
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/hub')}>
                  View in Hub
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="card-interactive" onClick={() => navigate('/hub')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Open Mission Hub
              </CardTitle>
              <CardDescription>
                View your weekly schedule and start timers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {thisWeekAssignments.length} assignments scheduled this week
              </p>
            </CardContent>
          </Card>

          <Card className="card-interactive" onClick={() => navigate('/assignments')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Manage Assignments
              </CardTitle>
              <CardDescription>
                Add, edit, or delete your assignments
              </CardDescription>
             </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {profileAssignments.length - completedAssignments.length} pending assignments
              </p>
            </CardContent>
          </Card>

          <Card className="card-interactive opacity-75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
                Sync from Canvas
              </CardTitle>
              <CardDescription>
                Import assignments from your LMS (Demo)
              </CardDescription>
             </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest completed assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {completedAssignments.length > 0 ? (
              <div className="space-y-3">
                {completedAssignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-success-light/20 rounded-lg border border-success/20">
                    <div>
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="status-done">Completed</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatTime(assignment.timeSpent)} spent
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No completed assignments yet. Start working on your tasks!
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;