import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CircularTimer } from './CircularTimer';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, ArrowLeft, AlertTriangle, ExternalLink, ChevronDown, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { useAssignmentPlacement } from '@/hooks/useAssignmentPlacement';
import { useAssignments } from '@/hooks/useAssignments';
import { useSupabaseSchedule } from '@/hooks/useSupabaseSchedule';
import { isStudyHallBlock } from '@/lib/family-detection';
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
  const { assignments: profileAssignments, isLoading: isAssignmentsLoading } = useAssignments();
  const { getScheduleForDay } = useSupabaseSchedule();
  
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  // Wrap the setter to track all changes:
  const trackedSetCurrentBlockIndex = (newIndex: number | ((prev: number) => number)) => {
    if (typeof newIndex === 'function') {
      const nextValue = newIndex(currentBlockIndex);
      setCurrentBlockIndex(nextValue);
    } else {
      setCurrentBlockIndex(newIndex);
    }
  };
  const [localTimerRunning, setLocalTimerRunning] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number | null>(null);
  const [blockStatuses, setBlockStatuses] = useState<any[]>([]);

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

  // Get schedule data asynchronously
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  // Gate placement on data readiness
  const dataReady = !isAssignmentsLoading && !isScheduleLoading;

  if (!selectedProfile) {
    return <div>Loading...</div>;
  }

  // Don't schedule until data is ready - prevents early placement that causes fallbacks
  if (!dataReady) {
    return <div>Loading schedule...</div>;
  }

  // Memoize expensive calculations with assignment placement
  const { selectedDateObj, weekday } = useMemo(() => {
    const selectedDateObj = new Date(effectiveDate + 'T12:00:00');
    const weekday = selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay();
    
    return { selectedDateObj, weekday };
  }, [selectedProfile.id, effectiveDate, selectedProfile.displayName]);
  
  useEffect(() => {
    if (selectedProfile?.displayName) {
      setIsScheduleLoading(true);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDateObj = new Date(effectiveDate + 'T12:00:00');
      const weekday = selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay();
      const dayName = dayNames[weekday === 7 ? 0 : weekday];
      
      getScheduleForDay(selectedProfile.displayName, dayName)
        .then(schedule => {

          // Sort blocks by start time
          const sortedBlocks = schedule.sort((a, b) => {
            const timeA = a.start_time.split(':').map(Number);
            const timeB = b.start_time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
          });


          setScheduleBlocks(sortedBlocks);
        })
        .catch(err => console.error('Failed to load schedule:', err))
        .finally(() => setIsScheduleLoading(false));
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

  // Determine if some blocks have been completed
  const hasCompletedSomeBlocks = useMemo(() => {
    return blockStatuses.some(status => status.status === 'complete' || status.status === 'overtime');
  }, [blockStatuses]);

  // Filter guidedBlocks based on completion status
  const blocksToShow = useMemo(() => {
    if (hasCompletedSomeBlocks) {
      // Only show incomplete blocks
      return guidedBlocks.filter(block => {
        const status = blockStatuses.find(s => s.template_block_id === block.id);
        return !status || (status.status !== 'complete' && status.status !== 'overtime');
      });
    }
    return guidedBlocks; // Show all blocks on fresh start
  }, [guidedBlocks, blockStatuses, hasCompletedSomeBlocks]);

  // After guidedBlocks are calculated, check status and find starting block
  React.useEffect(() => {
    async function findStartingBlock() {
      // Only auto-position if we haven't manually set a position yet
      if (currentBlockIndex !== 0) return;

      const { data: statuses } = await supabase
        .from('daily_schedule_status')
        .select('*')
        .or(`student_name.eq.demo-${selectedProfile?.displayName?.toLowerCase()},student_name.ilike.${selectedProfile?.displayName}`)
        .eq('date', selectedDate);

      const todayStatuses = statuses?.filter(s => s.date === selectedDate) || [];

      // Update block statuses state for filtering
      setBlockStatuses(todayStatuses);

      if (todayStatuses && todayStatuses.length > 0) {
        // Find first incomplete block
        const firstIncomplete = guidedBlocks.findIndex(block => {
          const status = todayStatuses.find(s => s.template_block_id === block.id);
          return !status || (status.status !== 'complete' && status.status !== 'overtime');
        });

        // If all regular blocks are done, show after-school summary
        if (firstIncomplete === -1) {
          setCurrentBlockIndex(guidedBlocks.length); // Past the last block
        } else {
          setCurrentBlockIndex(firstIncomplete);
        }
      }
    }

    if (guidedBlocks.length > 0) {
      findStartingBlock();
    }
  }, [guidedBlocks.length, selectedDate, selectedProfile]); // Remove currentBlockIndex from deps


  const currentBlock = blocksToShow[currentBlockIndex];
  const totalBlocks = blocksToShow.length;

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


  const handleTimerComplete = () => {
    setLocalTimerRunning(false);
    toast({
      title: "Time's up! 🎉",
      description: "Great work! Ready to move to the next block?"
    });
  };

  const handleMarkComplete = async () => {
    

    try {
      
      // Add status update to daily_schedule_status table
      const { error } = await supabase.from('daily_schedule_status')
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
      }
      
      if (currentBlock?.assignment) {
        // Update assignment as completed
        await supabase.from('assignments')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', currentBlock.assignment.id);
          
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
        // Reached end of regular blocks - will show after-school check on next render
        onBackToHub();
      }
    }, 1000);
  };

  const handleNeedMoreTime = async () => {
    if (!currentBlock?.assignment) return;

    // Move to block 999 AND keep a flag that it needs attention
    await supabase.from('demo_assignments').update({
      scheduled_block: 999,
      needs_reschedule: true  // Keep this TRUE so we know it needs work
    }).eq('id', currentBlock.assignment.id);

    toast({
      title: "Moved to After School",
      description: "Complete this after regular hours"
    });

    setCurrentBlockIndex(prev => prev + 1);
  };

  const handleStuck = async () => {
    if (!currentBlock) return;


    try {
      // Save stuck status
      await supabase.from('daily_schedule_status')
        .upsert({
          template_block_id: currentBlock.id,
          date: selectedDate,
          student_name: `demo-${selectedProfile?.displayName.toLowerCase()}`,
          status: 'stuck'
        }, {
          onConflict: 'student_name,date,template_block_id'
        });


      // Send email notification
      const { error } = await supabase.functions.invoke('send-stuck-notification', {
        body: {
          student: selectedProfile?.displayName,
          assignment: currentBlock.assignment?.title || currentBlock.subject,
          reason: 'Student clicked stuck button'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
      }

      toast({
        title: "Help is on the way! 🤝",
        description: "Mom has been notified"
      });

      trackedSetCurrentBlockIndex(prev => Math.min(blocksToShow.length - 1, prev + 1));

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




  // Handle end-of-day logic with after-school and stuck work check
  const [incompleteWork, setIncompleteWork] = React.useState<{afterSchool: any[], stuck: any[], incomplete: any[]}>({ afterSchool: [], stuck: [], incomplete: [] });
  const [checkedIncomplete, setCheckedIncomplete] = React.useState(false);

  React.useEffect(() => {
    async function checkIncompleteWork() {
      if (currentBlock || checkedIncomplete) return;

      // Get after-school assignments (block 999)
      const afterSchoolAssignments = profileAssignments.filter(a =>
        (a.scheduled_block === 999 || a.needs_reschedule === true) &&
        a.scheduled_date === selectedDate
      );

      // Fetch stuck blocks for today
      const { data: todayStatuses } = await supabase
        .from('daily_schedule_status')
        .select('*')
        .eq('student_name', `demo-${selectedProfile?.displayName?.toLowerCase()}`)
        .eq('date', selectedDate)
        .in('status', ['stuck', 'overtime']);

      // Get stuck assignments
      const stuckBlocks = todayStatuses?.filter(s => s.status === 'stuck') || [];
      const stuckAssignments = stuckBlocks.map(status => {
        const block = guidedBlocks.find(b => b.id === status.template_block_id);
        return block?.assignment;
      }).filter(Boolean) || [];

      // Get incomplete blocks (blocks without 'complete' status that had assignments)
      const completedBlockIds = new Set(todayStatuses?.filter(s => s.status === 'complete').map(s => s.template_block_id) || []);
      const incompleteBlocks = guidedBlocks.filter(block =>
        block.assignment && // Had an assignment
        !completedBlockIds.has(block.id) && // Not marked complete
        !stuckBlocks.some(s => s.template_block_id === block.id) && // Not marked stuck
        !afterSchoolAssignments.some(a => a.id === block.assignment?.id) // Not moved to after school
      ).map(block => ({
        id: block.id,
        time: block.startTime,
        assignment: block.assignment,
        subject: block.subject
      }));

      setIncompleteWork({ afterSchool: afterSchoolAssignments, stuck: stuckAssignments, incomplete: incompleteBlocks });
      setCheckedIncomplete(true);
    }

    checkIncompleteWork();
  }, [currentBlock, selectedDate, selectedProfile, profileAssignments, guidedBlocks, checkedIncomplete]);

  if (!currentBlock) {
    const hasIncompleteWork = (incompleteWork.afterSchool.length > 0 || incompleteWork.stuck.length > 0 || incompleteWork.incomplete.length > 0) && checkedIncomplete;

    if (!hasIncompleteWork && checkedIncomplete) {
      // Really all done
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

    if (hasIncompleteWork) {
      // Show incomplete work reminder
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8">
              <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Regular School Complete</h2>
              <p className="text-xl text-orange-600 font-semibold mb-4">
                ⚠️ You have unfinished work to complete
              </p>

              {/* Show the incomplete blocks with empty circles */}
              {incompleteWork.incomplete.length > 0 && (
                <div className="bg-orange-50 p-4 rounded mb-4">
                  <h3 className="font-bold mb-2">Still Need to Complete:</h3>
                  {incompleteWork.incomplete.map(block => (
                    <div key={block.id} className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⭕</span>
                      <span>{block.time} - {block.assignment?.title || block.subject}</span>
                    </div>
                  ))}
                </div>
              )}

              {incompleteWork.afterSchool.length > 0 && (
                <div className="bg-orange-50 p-4 rounded mb-4">
                  <h3 className="font-bold mb-2">Needs More Time:</h3>
                  {incompleteWork.afterSchool.map(a => (
                    <div key={a.id} className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⭕</span>
                      <span>{a.title}</span>
                      {a.canvas_url && (
                        <a href={a.canvas_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 ml-auto">
                          Canvas Link →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {incompleteWork.stuck.length > 0 && (
                <div className="bg-red-50 p-4 rounded mb-4">
                  <h3 className="font-bold mb-2">Got Stuck On:</h3>
                  {incompleteWork.stuck.map((a, index) => (
                    <div key={a.id || index} className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⭕</span>
                      <span>{a.title}</span>
                      {a.canvas_url && (
                        <a href={a.canvas_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 ml-auto">
                          Canvas Link →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-600 mb-4">
                Return to Overview to see instructions and mark items complete.
              </p>

              <Button onClick={() => onBackToHub()} className="w-full">
                Back to Overview
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Still loading/checking
    return null;
  }

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
              {currentBlock.assignment?.title || 
                (Boolean(currentBlock.fallback) && isStudyHallBlock(currentBlock.blockType, currentBlock.startTime, currentBlock.subject, currentBlock.subject) ? currentBlock.fallback : null) ||
                currentBlock.subject}
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

            {/* Fallback content - only for Study Hall blocks */}
            {(() => {
              const isStudyHall = isStudyHallBlock(currentBlock.blockType, currentBlock.startTime, currentBlock.subject, currentBlock.subject);
              
              // Safety check - warn about improper fallbacks
              if (!isStudyHall && currentBlock.fallback) {
                console.warn('Unexpected fallback on non-Study Hall block:', {
                  id: currentBlock.id, 
                  block_type: currentBlock.blockType, 
                  time: currentBlock.startTime
                });
              }
              
              // Only show fallback in Study Hall blocks AND only if hook set .fallback
              const showFallback = Boolean(currentBlock.fallback) && isStudyHall;
              
              if (showFallback) {
                return (
                  <Card className="bg-muted/30 border-none">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground italic">{currentBlock.fallback}</p>
                    </CardContent>
                  </Card>
                );
              }
              
              // For Assignment blocks with no assignment, show neutral placeholder
              if (!currentBlock.assignment && currentBlock.blockType === 'Assignment') {
                return (
                  <Card className="bg-muted/30 border-none">
                    <CardContent className="p-4">
                      <div className="text-sm opacity-60">No assignment selected</div>
                    </CardContent>
                  </Card>
                );
              }
              
              return null;
            })()}

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