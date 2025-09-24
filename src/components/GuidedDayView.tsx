import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CircularTimer } from './CircularTimer';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, BookOpen, ArrowLeft, AlertTriangle, Target, ExternalLink, ChevronDown, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { useAssignmentPlacement } from '@/hooks/useAssignmentPlacement';
import { useAssignments } from '@/hooks/useAssignments';
import { useSupabaseSchedule } from '@/hooks/useSupabaseSchedule';
import { supabase } from '@/integrations/supabase/client';
import { PopulatedScheduleBlock } from '@/types/schedule';


interface GuidedDayViewProps {
  onBackToHub: (needsReload?: boolean) => void;
  selectedDate: string;
  populatedSchedule?: PopulatedScheduleBlock[];
}

export const GuidedDayView: React.FC<GuidedDayViewProps> = ({
  onBackToHub,
  selectedDate,
  populatedSchedule
}) => {
  const effectiveDate = selectedDate;
  
  const {
    selectedProfile,
    updateAssignment,
    startTimer,
    pauseTimer,
    stopTimer,
    activeTimer
  } = useApp();
  
  // Get unified assignments and schedule data
  const { assignments: profileAssignments } = useAssignments();
  const { getScheduleForDay } = useSupabaseSchedule();
  
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  // Wrap the setter to track all changes:
  const trackedSetCurrentBlockIndex = (newIndex: number | ((prev: number) => number)) => {
    if (typeof newIndex === 'function') {
      const nextValue = newIndex(currentBlockIndex);
      console.trace('CHANGING currentBlockIndex from', currentBlockIndex, 'to', nextValue);
      setCurrentBlockIndex(nextValue);
    } else {
      console.trace('CHANGING currentBlockIndex from', currentBlockIndex, 'to', newIndex);
      setCurrentBlockIndex(newIndex);
    }
  };
  const [localTimerRunning, setLocalTimerRunning] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Helper function - memoized to avoid recreation
  const calculateBlockDuration = useCallback((startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return Math.max(1, endMinutes - startMinutes);
  }, []);

  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  // Helper function to determine deadline urgency
  const getDeadlineUrgency = useCallback((dueDate: string | null) => {
    if (!dueDate) return null;

    const due = new Date(dueDate + 'T12:00:00');
    const today = new Date(selectedDate + 'T12:00:00');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (due < today) return { level: 'overdue', text: 'OVERDUE!' };
    if (due <= tomorrow) return { level: 'critical', text: 'Due Tomorrow!' };
    if (due <= new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000))
      return { level: 'warning', text: 'Due Soon' };
    return null;
  }, [selectedDate]);

  if (!selectedProfile) {
    return <div>Loading...</div>;
  }

  // Memoize expensive calculations with assignment placement
  const { selectedDateObj, weekday } = useMemo(() => {
    const selectedDateObj = new Date(effectiveDate + 'T12:00:00');
    const weekday = selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay();
    
    return { selectedDateObj, weekday };
  }, [selectedProfile.id, effectiveDate, selectedProfile.displayName]);
  
  // Get schedule data asynchronously
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  useEffect(() => {
    if (selectedProfile?.displayName) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDateObj = new Date(effectiveDate + 'T12:00:00');
      const weekday = selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay();
      const dayName = dayNames[weekday === 7 ? 0 : weekday];
      
      getScheduleForDay(selectedProfile.displayName, dayName)
        .then(schedule => {
          console.log('Blocks loaded:', schedule.map(b => ({
            id: b.id,
            time: b.start_time,
            subject: b.subject
          })));

          // Sort blocks by start time
          const sortedBlocks = schedule.sort((a, b) => {
            const timeA = a.start_time.split(':').map(Number);
            const timeB = b.start_time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
          });

          console.log('Blocks after sorting:', sortedBlocks.map(b => ({
            id: b.id,
            time: b.start_time,
            subject: b.subject
          })));

          setScheduleBlocks(sortedBlocks);
        })
        .catch(err => console.error('Failed to load schedule:', err));
    }
  }, [selectedProfile?.displayName, effectiveDate, getScheduleForDay]);


  // Use assignment placement logic to populate blocks with assignments
  const { populatedBlocks } = useAssignmentPlacement(
    profileAssignments,
    scheduleBlocks,
    selectedProfile.displayName,
    effectiveDate
  );

  // Build guided blocks from populated schedule or calculate if not provided
  const guidedBlocks = useMemo(() => {
    if (populatedSchedule && populatedSchedule.length > 0) {
      // Use what Dashboard calculated
      console.log('GuidedDayView - Using provided populatedSchedule:', populatedSchedule.length);
      return populatedSchedule.map(block => ({
        id: block.id,
        blockNumber: block.block_number,
        startTime: block.start_time,
        endTime: block.end_time,
        subject: block.subject,
        blockType: block.block_type,
        assignment: block.assignment,
        assignedFamily: block.assignedFamily,
        fallback: block.fallback,
        duration: calculateBlockDuration(block.start_time, block.end_time)
      }));
    }

    // Fallback to current calculation if not provided
    console.log('GuidedDayView - Raw scheduleBlocks:', scheduleBlocks.length);
    console.log('GuidedDayView - populatedBlocks:', populatedBlocks.length, populatedBlocks);

    return populatedBlocks.map(block => ({
      id: block.id,
      blockNumber: block.block_number,
      startTime: block.start_time,
      endTime: block.end_time,
      subject: block.subject,
      blockType: block.block_type,
      assignment: block.assignment || null,
      assignedFamily: block.assignedFamily,
      fallback: block.fallback,
      duration: calculateBlockDuration(block.start_time, block.end_time)
    }));
  }, [populatedSchedule, populatedBlocks, calculateBlockDuration, scheduleBlocks.length]);

  // After guidedBlocks are calculated, check status and find starting block
  React.useEffect(() => {
    async function findStartingBlock() {
      console.log('Finding starting block for DATE:', selectedDate); // Check what date it's using
      console.log('Profile:', selectedProfile?.displayName);

      const { data: statuses } = await supabase
        .from('daily_schedule_status')
        .select('*')
        .or(`student_name.eq.demo-${selectedProfile?.displayName?.toLowerCase()},student_name.ilike.${selectedProfile?.displayName}`)
        .eq('date', selectedDate);

      // Only use statuses from today, not previous days
      const todayStatuses = statuses?.filter(s => s.date === selectedDate) || [];

      console.log('Found statuses:', statuses);
      console.log('Filtered to today only:', todayStatuses);

      if (todayStatuses && todayStatuses.length > 0) {
        const firstIncomplete = guidedBlocks.findIndex(block => {
          const status = todayStatuses.find(s => s.template_block_id === block.id);
          console.log('Block:', block.id, 'Status:', status?.status);
          return !status || (status.status !== 'complete' && status.status !== 'overtime' && status.status !== 'stuck');
        });

        console.log('First incomplete index:', firstIncomplete);
        trackedSetCurrentBlockIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
      } else {
        trackedSetCurrentBlockIndex(0);
      }
    }

    if (guidedBlocks.length > 0) {
      findStartingBlock();
    }
  }, [guidedBlocks, selectedDate, selectedProfile]);

  // console.log('RENDER - currentBlockIndex:', currentBlockIndex);
  // console.log('RENDER - guidedBlocks length:', guidedBlocks.length);
  // console.log('RENDER - currentBlock:', guidedBlocks[currentBlockIndex]);
  // console.log('Block 0:', guidedBlocks[0]);
  // console.log('Block 1:', guidedBlocks[1]);

  const currentBlock = guidedBlocks[currentBlockIndex];
  const totalBlocks = guidedBlocks.length;

  // Initialize timer when block changes
  useEffect(() => {
    if (currentBlock) {
      const totalSeconds = currentBlock.duration * 60;
      setLocalTimeRemaining(totalSeconds);
      // Auto-start timer when block loads
      setLocalTimerRunning(true);
      toast({
        title: "Timer started! 🎯",
        description: "Focus time has begun!"
      });
    }
  }, [currentBlockIndex, currentBlock]); // Ensure it triggers when currentBlock is available

  // Real-time countdown - this ensures REAL seconds are counted
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (localTimerRunning && localTimeRemaining !== null && localTimeRemaining > 0) {
      interval = setInterval(() => {
        setLocalTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            setLocalTimerRunning(false);
            return 0;
          }
          return prev - 1; // Count down by 1 second every 1000ms
        });
      }, 1000); // EXACTLY 1000ms = 1 real second
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [localTimerRunning, localTimeRemaining]);

  const handleTimerStop = () => {
    if (currentBlock) {
      setLocalTimerRunning(false);
      toast({
        title: "Timer stopped",
        description: "Time tracking paused"
      });
    }
  };

  const handleTimerComplete = () => {
    setLocalTimerRunning(false);
    toast({
      title: "Time's up! 🎉",
      description: "Great work! Ready to move to the next block?"
    });
  };

  const handleMarkComplete = async () => {
    console.log('Done clicked, currentBlock:', currentBlock);
    
    // Calculate time spent (in minutes)
    const timeSpent = localTimeRemaining !== null 
      ? Math.round((calculateBlockDuration(currentBlock.startTime, currentBlock.endTime) - (localTimeRemaining / 60)))
      : calculateBlockDuration(currentBlock.startTime, currentBlock.endTime);

    try {
      console.log('selectedDate value:', selectedDate, 'type:', typeof selectedDate);
      console.log('student name:', selectedProfile?.displayName);
      
      // Add status update to daily_schedule_status table
      const { data, error } = await supabase.from('daily_schedule_status')
        .upsert({ 
          template_block_id: currentBlock.id,
          date: effectiveDate,
          student_name: `demo-${selectedProfile?.displayName.toLowerCase()}`,
          status: 'complete' 
        }, {
          onConflict: 'student_name,date,template_block_id'
        });
      
      if (error) {
        console.error('Upsert failed:', error);
      } else {
        console.log('Upsert successful:', data);
      }
      
      if (currentBlock?.assignment) {
        // Update assignment as completed
        const assignmentResult = await supabase.from('assignments')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', currentBlock.assignment.id);
        console.log('Assignment update result:', assignmentResult);
          
        updateAssignment(currentBlock.assignment.id, {
          completed: true
        });
      }
    } catch (error) {
      console.error('Database error:', error);
    }
    
    toast({
      title: "Block complete! 🌟",
      description: "Excellent work! Moving to next block."
    });
    
    // Auto-advance to next block for ALL block types
    setTimeout(() => {
      if (currentBlockIndex < totalBlocks - 1) {
        trackedSetCurrentBlockIndex(prev => prev + 1);
        setLocalTimerRunning(false);
      } else {
        // All done!
        toast({
          title: "All blocks complete! 🎊",
          description: "Amazing work today!"
        });
        onBackToHub();
      }
    }, 1000);
  };

  const handleNeedMoreTime = async () => {
    if (!currentBlock || !currentBlock.assignment) return;

    const assignment = currentBlock.assignment;
    const today = new Date(selectedDate + 'T12:00:00');
    today.setHours(23, 59, 59, 999);

    // Assignment is "critical" if due tomorrow (needs completion today)
    const isCriticalDeadline = assignment.due_date && (() => {
      const dueDate = new Date(assignment.due_date + 'T12:00:00');
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return dueDate <= tomorrow;
    })();

    if (isCriticalDeadline) {
      // Must complete TODAY (due tomorrow or sooner)
      const remainingTodaySlots = guidedBlocks
        .slice(currentBlockIndex + 1)
        .filter(block =>
          block.subject === 'Assignment' &&
          !block.assignment
        );

      if (remainingTodaySlots.length > 0) {
        const nextSlot = remainingTodaySlots[0];

        await supabase.from('demo_assignments')
          .update({
            scheduled_block: nextSlot.blockNumber,
            scheduled_date: selectedDate
          })
          .eq('id', assignment.id);

        toast({
          title: "⚠️ Moved to later today",
          description: `Due tomorrow at co-op - must complete today! Moved to ${nextSlot.startTime}`,
          variant: "destructive"
        });
      } else {
        // No more slots - needs after-school work
        toast({
          title: "🚨 Due Tomorrow - No Slots Left!",
          description: "This needs to be done after school today. Cannot push to tomorrow!",
          variant: "destructive"
        });

        await supabase.from('daily_schedule_status')
          .upsert({
            template_block_id: currentBlock.id,
            date: selectedDate,
            student_name: `demo-${selectedProfile?.displayName.toLowerCase()}`,
            status: 'overtime-critical'
          });
      }
    } else {
      // Due in 2+ days, can safely reschedule to tomorrow
      setIsRescheduling(true);

      try {
        // Mark current block as overtime
        await supabase.from('daily_schedule_status')
          .upsert({
            template_block_id: currentBlock.id,
            date: selectedDate,
            student_name: `demo-${selectedProfile?.displayName.toLowerCase()}`,
            status: 'overtime'
          });

        // Update assignment to clear today's scheduling
        await supabase.from('demo_assignments')
          .update({
            scheduled_block: null,
            scheduled_date: null  // Clear so it can be rescheduled
          })
          .eq('id', assignment.id);

        toast({
          title: "Rescheduled for tomorrow",
          description: "You'll see this assignment in tomorrow's schedule",
        });

        // Move to next block
        if (currentBlockIndex < totalBlocks - 1) {
          trackedSetCurrentBlockIndex(prev => prev + 1);
        }
      } finally {
        setIsRescheduling(false);
      }
    }
  };

  const handleStuck = async () => {
    if (!currentBlock) return;

    console.log('Stuck button clicked, starting process...');

    try {
      // Save stuck status
      console.log('Saving stuck status to database...');
      await supabase.from('daily_schedule_status')
        .upsert({
          template_block_id: currentBlock.id,
          date: selectedDate,
          student_name: `demo-${selectedProfile?.displayName.toLowerCase()}`,
          status: 'stuck'
        }, {
          onConflict: 'student_name,date,template_block_id'
        });

      console.log('Status saved, now sending email...');

      // Send email notification
      const { data, error } = await supabase.functions.invoke('send-stuck-notification', {
        body: {
          student: selectedProfile?.displayName,
          assignment: currentBlock.assignment?.title || currentBlock.subject,
          reason: 'Student clicked stuck button'
        }
      });

      console.log('Edge function response:', data);
      if (error) {
        console.error('Edge function error:', error);
      }

      toast({
        title: "Help is on the way! 🤝",
        description: "Mom has been notified"
      });

      trackedSetCurrentBlockIndex(prev => Math.min(guidedBlocks.length - 1, prev + 1));

    } catch (error) {
      console.error('Complete stuck handler error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const canGoNext = currentBlockIndex < totalBlocks - 1;
  const canGoPrev = currentBlockIndex > 0;

  const getBlockTypeIcon = (blockType: string) => {
    switch (blockType?.toLowerCase()) {
      case 'bible':
        return BookOpen;
      case 'assignment':
        return Target;
      case 'lunch':
      case 'movement':
        return Clock;
      case 'co-op':
      case 'travel':
      case 'prep/load':
        return ChevronRight;
      default:
        return Clock;
    }
  };

  const getBlockTypeColor = (blockType: string) => {
    switch (blockType?.toLowerCase()) {
      case 'bible':
        return 'text-purple-600';
      case 'assignment':
        return 'text-primary';
      case 'lunch':
        return 'text-green-600';
      case 'movement':
        return 'text-blue-600';
      case 'co-op':
        return 'text-orange-600';
      case 'travel':
      case 'prep/load':
        return 'text-slate-600';
      default:
        return 'text-muted-foreground';
    }
  };

  // Show loading overlay when rescheduling
  if (isRescheduling) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Rescheduling Assignment...</h2>
            <p className="text-muted-foreground">
              Updating your schedule to accommodate extra time needed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentBlock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">All Done! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              You've completed all your blocks for today. Great work!
            </p>
            <Button onClick={() => onBackToHub()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to StudyFlow
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const BlockIcon = getBlockTypeIcon(currentBlock.blockType || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <div className="container max-w-2xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => onBackToHub()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Button>
          <div className="text-right">
            <p className="text-muted-foreground">
              Block {currentBlockIndex + 1} of {totalBlocks}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={currentBlockIndex / Math.max(1, totalBlocks - 1) * 100} className="h-2" />
          <p className="text-base text-center text-muted-foreground">
            {Math.round(currentBlockIndex / Math.max(1, totalBlocks - 1) * 100)}% through your day
          </p>
        </div>

        {/* Current Block Card */}
        <Card className="card-elevated border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Badge variant="outline" className="text-base font-medium">
                {currentBlock.startTime} - {currentBlock.endTime}
              </Badge>
              {currentBlock.assignment && (() => {
                const urgency = getDeadlineUrgency(currentBlock.assignment.due_date);
                return urgency && (
                  <Badge variant={
                    urgency.level === 'overdue' ? 'destructive' :
                    urgency.level === 'critical' ? 'destructive' :
                    'default'
                  }>
                    {urgency.text}
                  </Badge>
                );
              })()}
            </div>
            <h1 className="text-3xl font-bold">
              {currentBlock.assignment?.title || currentBlock.fallback || currentBlock.subject}
            </h1>
            <p className="text-muted-foreground">
              {currentBlock.blockType} • {formatTime(currentBlock.duration)}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Timer */}
            <div className="flex justify-center">
              {currentBlock && (
                <CircularTimer 
                  durationMinutes={currentBlock.duration} 
                  isRunning={localTimerRunning} 
                  onComplete={handleTimerComplete} 
                  externalTimeRemaining={localTimeRemaining || (currentBlock.duration * 60)} 
                  className="" 
                  hideControls={true} 
                />
              )}
            </div>

            {/* Assignment Instructions - Collapsible */}
            {currentBlock.assignment && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto border border-border/50 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium">View Assignment Instructions</span>
                    </div>
                    <ChevronDown className="w-4 h-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-4">
                  <Card className="bg-muted/30 border-none">
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {currentBlock.assignment.title}
                        </h3>
                        
                        {currentBlock.assignment.subject && (
                          <p className="text-base">
                            <strong>Subject:</strong> {currentBlock.assignment.subject}
                          </p>
                        )}
                        
                        {currentBlock.assignment.due_date && (
                          <p className="text-base">
                            <strong>Due:</strong> {new Date(currentBlock.assignment.due_date).toLocaleDateString()}
                          </p>
                        )}

                        {(currentBlock.assignment as any).instructions && (
                          <div className="space-y-2">
                            <p className="font-medium">Instructions:</p>
                            <div className="bg-background/50 p-4 rounded-lg border">
                              <p className="text-sm leading-relaxed">{(currentBlock.assignment as any).instructions}</p>
                            </div>
                          </div>
                        )}

                        {currentBlock.assignment.canvas_url && (
                          <Button size="lg" asChild className="w-full gap-2 bg-primary/90 hover:bg-primary/80">
                            <a href={currentBlock.assignment.canvas_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                              Open Assignment in Canvas
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Non-Assignment Block Info */}
            {!currentBlock.assignment && currentBlock.fallback && (
              <Card className="bg-muted/30 border-none">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground italic">{currentBlock.fallback}</p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Always show all buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={handleMarkComplete}
                size="lg"
                className="gap-2 bg-success text-success-foreground hover:bg-success/90 text-base font-semibold py-4"
              >
                <CheckCircle className="w-6 h-6" />
                Done!
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleNeedMoreTime}
                size="lg"
                className="gap-2 border-2 py-4 text-base font-semibold"
              >
                <Clock className="w-6 h-6" />
                More Time
              </Button>
            </div>

            {/* Stuck Button - Always available */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleStuck}
                size="lg"
                className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50 border-2 py-4 text-base font-semibold"
              >
                <AlertTriangle className="w-6 h-6" />
                I'm Stuck - Need Help
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-border/50">
              <Button 
                variant="ghost" 
                onClick={() => trackedSetCurrentBlockIndex(prev => Math.max(0, prev - 1))} 
                disabled={!canGoPrev} 
                size="lg" 
                className="gap-3 text-base font-semibold py-4"
              >
                <ChevronLeft className="w-6 h-6" />
                Previous
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => trackedSetCurrentBlockIndex(prev => Math.min(totalBlocks - 1, prev + 1))} 
                disabled={!canGoNext} 
                size="lg" 
                className="gap-3 text-base font-semibold py-4"
              >
                Next
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};