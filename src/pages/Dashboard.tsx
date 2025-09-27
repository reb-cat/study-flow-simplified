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
import { AfterSchoolSummary } from '@/components/AfterSchoolSummary';
import { getStudentNameFromId } from '@/lib/utils';

const Dashboard = () => {
  const { 
    selectedProfile, 
    currentUser 
  } = useApp();
  
  const { getCachedScheduleForDay } = useScheduleCache();
  const { assignments } = useAssignments();

  console.log('Dashboard assignments:', assignments);
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showGuidedMode, setShowGuidedMode] = useState(false);
  const [guidedDate, setGuidedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekSchedules, setWeekSchedules] = useState<Record<string, SupabaseScheduleBlock[]>>({});
  const [weekScheduleWithAssignments, setWeekScheduleWithAssignments] = useState<Record<string, PopulatedScheduleBlock[]>>({});

  if (!selectedProfile || !currentUser) {
    console.log('Missing profile or user:', { selectedProfile, currentUser });
    return <div>Loading...</div>;
  }

  // Get Monday of current week
  const getMonday = (date: Date) => {
    // Use noon to avoid timezone issues
    const dateStr = date.toISOString().split('T')[0];
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();

    // Calculate days to subtract to get to Monday
    const daysToSubtract = day === 0 ? 6 : day - 1;

    const monday = new Date(d);
    monday.setDate(d.getDate() - daysToSubtract);
    return monday;
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
          const dayString = day.toISOString().split('T')[0];
          // Use currentUser.id (UUID) for real users, fall back to displayName for demo users
          const studentIdentifier = currentUser?.id || selectedProfile.displayName;
          const blocks = await getCachedScheduleForDay(studentIdentifier, dayName);
          return { day: dayString, blocks };
        });

        const results = await Promise.all(promises);
        const finalWeekData: Record<string, SupabaseScheduleBlock[]> = {};
        results.forEach(({ day, blocks }) => {
          finalWeekData[day] = blocks;
        });

        setWeekSchedules(finalWeekData);
        console.log('Dashboard scheduleBlocks:', finalWeekData);
      } catch (error) {
        console.error('Error fetching week schedule:', error);
        setWeekSchedules({});
      }
    };

    fetchWeekSchedule();
  }, [currentUser?.id, selectedProfile?.displayName, currentWeek]); // Use UUID for real users, displayName for demo users

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
    console.log('About to call useAssignmentPlacement with:', {
      assignmentsLength: assignments?.length,
      blocksLength: Object.keys(weekSchedules).length,
      studentName: getStudentNameFromId(currentUser?.id || ''),
      currentUserId: currentUser?.id
    });
    
    if (!selectedProfile || !assignments || Object.keys(weekSchedules).length === 0) {
      return {};
    }


    // Collect all assignment blocks for the week with their day info
    const allBlocksForWeek: Array<SupabaseScheduleBlock & { dayDate: string; dayName: string }> = [];


    Object.entries(weekSchedules).forEach(([dayDate, dayBlocks]) => {
      const date = new Date(dayDate + 'T12:00:00');
      const dayName = getDayName(date);
      
      const assignableBlocks = dayBlocks.filter(block => {
        const blockType = (block.block_type || '');
        return block.block_number !== 999 &&
               (blockType === 'Assignment' || isStudyHallBlock(block.block_type, block.start_time));
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

    // Get unscheduled assignments or those scheduled for past dates, excluding historical completions
    const unscheduledAssignments = assignmentsWithFamily.filter(a => {
      // First filter: only show pending assignments OR today's completions
      const isCompletedToday = a.completion_status === 'completed' && 
                               a.completed_at && 
                               new Date(a.completed_at).toDateString() === new Date().toDateString();
      
      if (a.completion_status === 'completed' && !isCompletedToday) {
        return false; // Exclude historical completions
      }

      // Include if no schedule at all
      if (!a.scheduled_date && !a.scheduled_block) return true;

      // Include if scheduled for a past date (needs rescheduling)
      if (a.scheduled_date) {
        const scheduledDate = new Date(a.scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return scheduledDate < today;
      }

      return false;
    });

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
      // Convert UUID to student name for family detection
      const studentName = getStudentNameFromId(currentUser?.id || '');
      const family = getBlockFamily(studentName, dayName, block.block_number || 0);
      
      if (!family) {
        weekAssignmentData[dayDate].push({ ...block, assignment: undefined, assignedFamily: undefined });
        continue;
      }

      // Special case: Khalil's Algebra priority
      if (shouldPrioritizeAlgebra(studentName, dayName, block.block_number || 0)) {
        const algebraAssignment = unscheduledAssignments.find(a => 
          !scheduledAssignments.has(a.id) &&
          ((a.subject || '').toLowerCase().includes('algebra') || 
           (a.course_name || '').toLowerCase().includes('algebra'))
        );
        
        if (algebraAssignment) {
          // Skip old completed assignments (completed more than 24 hours ago)
          if (algebraAssignment.completion_status === 'completed' && algebraAssignment.completed_at && new Date(algebraAssignment.completed_at) < new Date(Date.now() - 86400000)) {
            // Don't add this assignment, continue to next logic
          } else {
            scheduledAssignments.add(algebraAssignment.id);
            weekAssignmentData[dayDate].push({ 
              ...block, 
              assignment: algebraAssignment,
              assignedFamily: family
            });
            continue;
          }
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
          // Skip old completed assignments (completed more than 24 hours ago)
          if (studyHallTask.completion_status === 'completed' && studyHallTask.completed_at && new Date(studyHallTask.completed_at) < new Date(Date.now() - 86400000)) {
            // Don't add this assignment, fall through to fallback
          } else {
            scheduledAssignments.add(studyHallTask.id);
            weekAssignmentData[dayDate].push({ 
              ...block, 
              assignment: studyHallTask,
              assignedFamily: family
            });
            continue;
          }
        }
        
        // Fallback for Study Hall when no suitable assignments
        weekAssignmentData[dayDate].push({ 
          ...block, 
          assignment: undefined,
          assignedFamily: family,
          fallback: 'Review notes'
        });
        continue;
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
        // Skip old completed assignments (completed more than 24 hours ago)
        if (selectedAssignment.completion_status === 'completed' && selectedAssignment.completed_at && new Date(selectedAssignment.completed_at) < new Date(Date.now() - 86400000)) {
          // Don't add this assignment, fall through to fallback
        } else {
          scheduledAssignments.add(selectedAssignment.id);
          weekAssignmentData[dayDate].push({ 
            ...block, 
            assignment: selectedAssignment,
            assignedFamily: family
          });
          continue;
        }
      }
      
      // Use existing fallback system
      const fallbacks = FALLBACKS[family];
      const fallback = Array.isArray(fallbacks) ? fallbacks[0] : fallbacks;
      weekAssignmentData[dayDate].push({ 
        ...block, 
        assignment: undefined, 
        assignedFamily: family,
        fallback: fallback
      });
    }

    // Add ALL blocks back to their respective days to ensure nothing is lost
    Object.entries(weekSchedules).forEach(([dayDate, dayBlocks]) => {
      // Get IDs of blocks we've already processed
      const processedBlockIds = new Set(weekAssignmentData[dayDate].map(b => b.id));

      // Find any blocks that haven't been added yet
      const unprocessedBlocks = dayBlocks.filter(block =>
        !processedBlockIds.has(block.id)
      );

      // Add all missing blocks
      unprocessedBlocks.forEach(block => {
        weekAssignmentData[dayDate].push({
          ...block,
          assignment: undefined,
          assignedFamily: undefined
        });
      });

      // Sort ALL blocks by start time
      weekAssignmentData[dayDate].sort((a, b) => {
        const timeA = a.start_time.split(':').map(Number);
        const timeB = b.start_time.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
    });

    return weekAssignmentData;
  }, [
    currentUser?.id,
    selectedProfile?.displayName,
    JSON.stringify(assignments?.map(a => ({ id: a.id, title: a.title, course_name: a.course_name }))),
    JSON.stringify(Object.keys(weekSchedules)),
    getDayName
  ]);

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

  // Modify onBackToHub to handle rescheduling
  const handleBackFromGuided = (needsReload?: boolean) => {
    if (needsReload) {
      // Refresh assignments and schedule, then re-enter guided mode
      window.location.href = window.location.href; // Clean reload maintaining state
    } else {
      setShowGuidedMode(false);
    }
  };

  // Show guided mode if enabled
  if (showGuidedMode) {

    const guidedDaySchedule = weekScheduleWithAssignments[guidedDate] || [];

    return (
      <GuidedDayView
        onBackToHub={handleBackFromGuided}
        selectedDate={guidedDate}
        populatedSchedule={guidedDaySchedule} // Pass the exact schedule
      />
    );
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

        {/* After School Summary */}
        <AfterSchoolSummary
          assignments={assignments}
          date={new Date().toISOString().split('T')[0]}
        />

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
                onDayClick={(dateStr) => {
                  setGuidedDate(dateStr);
                  setShowGuidedMode(true);
                }}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;