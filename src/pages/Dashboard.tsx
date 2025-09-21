import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useSupabaseSchedule, SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { useSupabaseAssignments } from '@/hooks/useSupabaseAssignments';
import { useScheduleCache } from '@/hooks/useScheduleCache';
import { DayScheduleCard } from '@/components/DayScheduleCard';

const Dashboard = () => {
  const { 
    selectedProfile, 
    currentUser 
  } = useApp();
  
  const { getCachedScheduleForDay } = useScheduleCache();
  const { assignments, updateAssignment: updateSupabaseAssignment } = useSupabaseAssignments(currentUser?.id);
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showGuidedMode, setShowGuidedMode] = useState(false);
  const [weekSchedules, setWeekSchedules] = useState<Record<string, SupabaseScheduleBlock[]>>({});

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

  const monday = useMemo(() => getMonday(currentWeek), [currentWeek]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  }, [monday]);

  // Get schedule data for the week - fetch all at once to avoid duplicate requests
  useEffect(() => {
    const fetchWeekSchedule = async () => {
      setWeekSchedules({});
      
      if (!selectedProfile) return;
      
      try {
        // Calculate weekDays inside effect to avoid dependency issues
        const weekDaysInEffect = Array.from({ length: 5 }, (_, i) => {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          return day;
        });
        
        // Fetch all days in parallel to avoid sequential requests
        const promises = weekDaysInEffect.map(async (day) => {
          const dayName = getDayName(day);
          const blocks = await getCachedScheduleForDay(selectedProfile.displayName, dayName);
          return { day: day.toISOString().split('T')[0], blocks };
        });

        const results = await Promise.all(promises);
        const finalWeekData: Record<string, SupabaseScheduleBlock[]> = {};
        results.forEach(({ day, blocks }) => {
          finalWeekData[day] = blocks;
        });
        
        setWeekSchedules(finalWeekData);
      } catch (error) {
        console.error('Error fetching week schedule:', error);
        setWeekSchedules({});
      }
    };

    fetchWeekSchedule();
  }, [selectedProfile?.displayName, currentWeek]); // Removed getCachedScheduleForDay to prevent infinite loops

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'numeric', 
      day: 'numeric' 
    });
  }, []);

  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  const formatTimerTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Helper to get day name for database query
  const getDayName = useCallback((date: Date): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[date.getDay()];
  }, []);

  const handleToggleComplete = useCallback(async (assignment: any) => {
    await updateSupabaseAssignment(assignment.id, { 
      completed_at: assignment.completed_at ? null : new Date().toISOString() 
    });
  }, [updateSupabaseAssignment]);

  // Timer functionality simplified for now
  const handleStartTimer = useCallback((assignmentId: string) => {
    console.log('Starting timer for assignment:', assignmentId);
    // TODO: Implement real timer functionality with Supabase
  }, []);

  const isTimerActive = useCallback((assignmentId: string) => {
    return false; // TODO: Implement real timer state
  }, []);

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentWeek(newWeek);
  }, [currentWeek]);

  const getWeekRange = useCallback(() => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, [monday]);

  // Get today's date for guided mode
  const today = new Date().toISOString().split('T')[0];

  // Show guided mode if enabled
  if (showGuidedMode) {
    return <GuidedDayView onBackToHub={() => setShowGuidedMode(false)} selectedDate={today} />;
  }

  return (
    <div className="min-h-screen bg-bg-soft">
      <Header />
      
      <main className="layout-breathe max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="ef-section bg-bg-warm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-hierarchy-1">Week of {getWeekRange()}</h1>
              <p className="text-muted-foreground">Your weekly learning journey</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Guided Mode Toggle */}
              <Button 
                onClick={() => setShowGuidedMode(true)}
                className="gap-2 bg-gradient-primary text-white hover:shadow-lg transition-all duration-200"
              >
                <Focus className="w-4 h-4" />
                Start Guided Day
              </Button>
              
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {weekDays.map((day, dayIndex) => (
            <DayScheduleCard 
              key={dayIndex}
              day={day}
              dayIndex={dayIndex}
              selectedProfile={selectedProfile}
              assignments={assignments}
              scheduleBlocks={weekSchedules[day.toISOString().split('T')[0]] || []}
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
        <Card className="ef-card bg-bg-cool">
          <CardHeader>
            <CardTitle className="text-hierarchy-2 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Week Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center ef-section bg-success-light border-success/20">
                <div className="text-3xl font-bold text-success mb-2">
                  {assignments.filter(a => {
                    if (!a.scheduled_date) return false;
                    const scheduled = new Date(a.scheduled_date);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).filter(a => a.completed_at).length}
                </div>
                <p className="text-sm font-medium text-success">Completed</p>
              </div>
              <div className="text-center ef-section bg-timer-light border-timer/20">
                <div className="text-3xl font-bold text-timer mb-2">
                  {assignments.filter(a => {
                    if (!a.scheduled_date) return false;
                    const scheduled = new Date(a.scheduled_date);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).length}
                </div>
                <p className="text-sm font-medium text-timer">Total Assignments</p>
              </div>
              <div className="text-center ef-section bg-primary-light border-primary/20">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatTime(assignments.filter(a => {
                    if (!a.scheduled_date) return false;
                    const scheduled = new Date(a.scheduled_date);
                    return weekDays.some(day => 
                      day.toISOString().split('T')[0] === scheduled.toISOString().split('T')[0]
                    );
                  }).reduce((total, a) => total + (a.time_spent || 0), 0))}
                </div>
                <p className="text-sm font-medium text-primary">Time Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;