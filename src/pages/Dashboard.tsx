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
import { useSupabaseSchedule } from '@/hooks/useSupabaseSchedule';
import { useSupabaseAssignments } from '@/hooks/useSupabaseAssignments';
import { DayScheduleCard } from '@/components/DayScheduleCard';

const Dashboard = () => {
  const { 
    selectedProfile, 
    currentUser 
  } = useApp();
  
  const { getScheduleForDay } = useSupabaseSchedule();
  const { assignments, updateAssignment: updateSupabaseAssignment } = useSupabaseAssignments(currentUser?.id);
  
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

  // Helper to get day name for database query
  const getDayName = (date: Date): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[date.getDay()];
  };

  const handleToggleComplete = async (assignment: any) => {
    await updateSupabaseAssignment(assignment.id, { 
      completed_at: assignment.completed_at ? null : new Date().toISOString() 
    });
  };

  // Timer functionality simplified for now
  const handleStartTimer = (assignmentId: string) => {
    console.log('Starting timer for assignment:', assignmentId);
    // TODO: Implement real timer functionality with Supabase
  };

  const isTimerActive = (assignmentId: string) => {
    return false; // TODO: Implement real timer state
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
          {weekDays.map((day, dayIndex) => (
            <DayScheduleCard 
              key={dayIndex}
              day={day}
              dayIndex={dayIndex}
              selectedProfile={selectedProfile}
              assignments={assignments}
              getScheduleForDay={getScheduleForDay}
              formatDate={formatDate}
              handleToggleComplete={handleToggleComplete}
              handleStartTimer={handleStartTimer}
              isTimerActive={isTimerActive}
              formatTime={formatTime}
              formatTimerTime={formatTimerTime}
              getDayName={getDayName}
            />
          ))}
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
                  {assignments.filter(a => {
                    if (!a.scheduled_date) return false;
                    const scheduled = new Date(a.scheduled_date);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).filter(a => a.completed_at).length}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-timer">
                  {assignments.filter(a => {
                    if (!a.scheduled_date) return false;
                    const scheduled = new Date(a.scheduled_date);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).length}
                </div>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {formatTime(assignments.filter(a => {
                    if (!a.scheduled_date) return false;
                    const scheduled = new Date(a.scheduled_date);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).reduce((total, a) => total + (a.time_spent || 0), 0))}
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

export default Dashboard;