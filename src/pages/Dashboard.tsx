import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Focus } from 'lucide-react';
import { Header } from '@/components/Header';
import { GuidedDayView } from '@/components/GuidedDayView';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { useAssignments } from '@/hooks/useAssignments';  
import { useScheduleCache } from '@/hooks/useScheduleCache';
import { OverviewDayCard } from '@/components/OverviewDayCard';
import { PopulatedScheduleBlock } from '@/types/schedule';
import { 
  detectFamily, 
  getBlockFamily, 
  isStudyHallBlock, 
  shouldPrioritizeAlgebra, 
  FALLBACKS, 
  requiresSpecialResources, 
  estimateAssignmentMinutes, 
  getStudyHallPriority 
} from '@/lib/family-detection';
import { UnifiedAssignment } from '@/types/assignment';

const Dashboard = () => {
  const { 
    selectedProfile, 
    currentUser 
  } = useApp();
  
  const { getCachedScheduleForDay } = useScheduleCache();
  const { assignments } = useAssignments();
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showGuidedMode, setShowGuidedMode] = useState(false);
  const [weekSchedules, setWeekSchedules] = useState<Record<string, SupabaseScheduleBlock[]>>({});
  const [weekScheduleWithAssignments, setWeekScheduleWithAssignments] = useState<Record<string, PopulatedScheduleBlock[]>>({});

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

  // Helper to get day name for database query
  const getDayName = useCallback((date: Date): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[date.getDay()];
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

  // Schedule assignments for the entire week at once
  const scheduleWeekAssignments = useCallback(() => {
    if (!selectedProfile || !assignments || Object.keys(weekSchedules).length === 0) {
      return {};
    }

    console.log('Running week-wide assignment placement');
    
    // Collect all assignment blocks for the week with their day info
    const allBlocksForWeek: Array<SupabaseScheduleBlock & { dayDate: string; dayName: string }> = [];
    
    Object.entries(weekSchedules).forEach(([dayDate, dayBlocks]) => {
      const date = new Date(dayDate + 'T12:00:00');
      const dayName = getDayName(date);
      
      const assignableBlocks = dayBlocks.filter(block => {
        const blockType = (block.block_type || '').toLowerCase();
        return blockType === 'assignment' || isStudyHallBlock(block.block_type, block.start_time);
      });
      
      assignableBlocks.forEach(block => {
        allBlocksForWeek.push({ ...block, dayDate, dayName });
      });
    });

    // Add family detection to assignments
    const assignmentsWithFamily = assignments.map(assignment => ({
      ...assignment,
      detectedFamily: detectFamily(assignment)
    }));

    // Get unscheduled assignments (no scheduled_date or scheduled_block)
    const unscheduledAssignments = assignmentsWithFamily.filter(a => 
      !a.scheduled_date && !a.scheduled_block
    );

    // Track which assignments have been scheduled to prevent duplicates across the entire week
    const scheduledAssignments = new Set<string>();
    const weekAssignmentData: Record<string, PopulatedScheduleBlock[]> = {};

    // Initialize each day's data
    Object.keys(weekSchedules).forEach(dayDate => {
      weekAssignmentData[dayDate] = [];
    });

    // Process blocks and populate with assignments
    for (const blockWithDay of allBlocksForWeek) {
      const { dayDate, dayName, ...block } = blockWithDay;
      const family = getBlockFamily(selectedProfile.displayName, dayName, block.block_number || 0);
      
      console.log('Processing block:', {
        day: dayName,
        blockNumber: block.block_number,
        blockType: block.block_type,
        family
      });
      
      if (!family) {
        weekAssignmentData[dayDate].push({ ...block, assignment: undefined, assignedFamily: undefined });
        continue;
      }

      // Special case: Khalil's Algebra priority
      if (shouldPrioritizeAlgebra(selectedProfile.displayName, dayName, block.block_number || 0)) {
        const algebraAssignment = unscheduledAssignments.find(a => 
          !scheduledAssignments.has(a.id) &&
          ((a.subject || '').toLowerCase().includes('algebra') || 
           (a.course_name || '').toLowerCase().includes('algebra'))
        );
        
        if (algebraAssignment) {
          scheduledAssignments.add(algebraAssignment.id);
          weekAssignmentData[dayDate].push({ 
            ...block, 
            assignment: algebraAssignment,
            assignedFamily: family
          });
          console.log('Assigned algebra to block:', algebraAssignment.title);
          continue;
        }
      }

      // Special case: Study Hall blocks get first pick of appropriate tasks
      if (isStudyHallBlock(block.block_type, block.start_time)) {
        const studyHallCandidates = unscheduledAssignments
          .filter(a => 
            !scheduledAssignments.has(a.id) &&
            estimateAssignmentMinutes(a) <= 25 &&
            !requiresSpecialResources(a)
          )
          .sort((a, b) => {
            // Sort by Study Hall priority (1=Reading, 2=Problems, 3=Review)
            const priorityA = getStudyHallPriority(a);
            const priorityB = getStudyHallPriority(b);
            if (priorityA !== priorityB) return priorityA - priorityB;
            
            // Then by due date (earliest first)
            if (a.due_date && b.due_date) {
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
            if (a.due_date) return -1;
            if (b.due_date) return 1;
            return 0;
          });
        
        const studyHallTask = studyHallCandidates[0];
        
        if (studyHallTask) {
          scheduledAssignments.add(studyHallTask.id);
          weekAssignmentData[dayDate].push({ 
            ...block, 
            assignment: studyHallTask,
            assignedFamily: family
          });
          console.log('Assigned Study Hall task:', studyHallTask.title, 'Priority:', getStudyHallPriority(studyHallTask));
          continue;
        } else {
          // Fallback for Study Hall when no suitable assignments
          weekAssignmentData[dayDate].push({ 
            ...block, 
            assignment: undefined,
            assignedFamily: family,
            fallback: 'Review notes'
          });
          console.log('No suitable Study Hall tasks, using fallback');
          continue;
        }
      }

      // Regular assignment matching by family
      const matchingAssignments = unscheduledAssignments
        .filter(a => 
          !scheduledAssignments.has(a.id) && 
          a.detectedFamily === family
        )
        .sort((a, b) => {
          // Sort by due date (earliest first)
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          return 0;
        });

      const selectedAssignment = matchingAssignments[0];
      
      if (selectedAssignment) {
        console.log('Assigned to block:', selectedAssignment.title);
        scheduledAssignments.add(selectedAssignment.id);
        weekAssignmentData[dayDate].push({ 
          ...block, 
          assignment: selectedAssignment,
          assignedFamily: family
        });
      } else {
        // Use existing fallback system
        const fallbacks = FALLBACKS[family];
        const fallback = Array.isArray(fallbacks) ? fallbacks[0] : fallbacks;
        console.log('No assignment found, using fallback:', fallback);
        weekAssignmentData[dayDate].push({ 
          ...block, 
          assignment: undefined, 
          assignedFamily: family,
          fallback: fallback
        });
      }
    }

    // Add all non-assignable blocks back to their respective days
    Object.entries(weekSchedules).forEach(([dayDate, dayBlocks]) => {
      const nonAssignableBlocks = dayBlocks.filter(block => {
        const blockType = (block.block_type || '').toLowerCase();
        return blockType !== 'assignment' && !isStudyHallBlock(block.block_type, block.start_time);
      });
      
      nonAssignableBlocks.forEach(block => {
        weekAssignmentData[dayDate].push({ ...block, assignment: undefined, assignedFamily: undefined });
      });
      
      // Sort blocks by start time
      weekAssignmentData[dayDate].sort((a, b) => {
        const aTime = typeof a.start_time === 'number' ? a.start_time : 0;
        const bTime = typeof b.start_time === 'number' ? b.start_time : 0;
        return aTime - bTime;
      });
    });

    return weekAssignmentData;
  }, [selectedProfile, assignments, weekSchedules, getDayName]);

  // Run assignment placement when schedules or assignments change
  useEffect(() => {
    const scheduledWeek = scheduleWeekAssignments();
    setWeekScheduleWithAssignments(scheduledWeek);
  }, [scheduleWeekAssignments]);

  // Helper function to identify short tasks suitable for Study Hall
  const isShortTask = useCallback((assignment: UnifiedAssignment & { detectedFamily: string }): boolean => {
    const title = (assignment.title || '').toLowerCase();
    
    // Keywords that suggest short tasks
    const shortTaskKeywords = [
      'quiz', 'check', 'review', 'practice', 'worksheet', 'exercise',
      'question', 'problem', 'drill', 'vocab', 'vocabulary'
    ];
    
    return shortTaskKeywords.some(keyword => title.includes(keyword));
  }, []);

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
              className="gap-2"
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
            const dayDate = day.toISOString().split('T')[0];
            return (
              <OverviewDayCard 
                key={dayIndex}
                day={day}
                selectedProfile={selectedProfile}
                assignments={assignments}
                scheduleBlocks={weekSchedules[dayDate] || []}
                populatedBlocks={weekScheduleWithAssignments[dayDate] || []}
                formatDate={formatDate}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;