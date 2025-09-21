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

interface GuidedDayViewProps {
  onBackToHub: () => void;
  selectedDate: string;
}

export const GuidedDayView: React.FC<GuidedDayViewProps> = ({
  onBackToHub,
  selectedDate
}) => {
  // TEST MODE OVERRIDE - Toggle for testing
  const isTestMode = true; // Set to false for production
  const testDate = '2025-09-22'; // Monday for testing - must have assignments
  
  // Use test date when in test mode, otherwise use provided selectedDate
  const effectiveDate = isTestMode ? testDate : selectedDate;
  
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
  const [localTimerRunning, setLocalTimerRunning] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number | null>(null);

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
        .then(schedule => setScheduleBlocks(schedule))
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

  // Build guided blocks from ALL populated blocks - NO FILTERING
  const guidedBlocks = useMemo(() => {
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
  }, [populatedBlocks, calculateBlockDuration, scheduleBlocks.length]);

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
  }, [currentBlockIndex]); // Changed dependency to only trigger when block actually changes

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

  const handleMarkComplete = () => {
    if (currentBlock?.assignment) {
      updateAssignment(currentBlock.assignment.id, {
        completed: true
      });
      toast({
        title: "Assignment complete! 🌟",
        description: "Excellent work! Moving to next block."
      });
      // Auto-advance to next block
      setTimeout(() => {
        if (currentBlockIndex < totalBlocks - 1) {
          setCurrentBlockIndex(prev => prev + 1);
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
    }
  };

  const handleNeedMoreTime = () => {
    toast({
      title: "No problem! 💙",
      description: "Take the time you need. You're doing great!"
    });
  };

  const handleStuck = () => {
    toast({
      title: "Help is on the way! 🤝",
      description: "This has been flagged for assistance."
    });
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
            <Button onClick={onBackToHub} className="gap-2">
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
          <Button variant="ghost" onClick={onBackToHub} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Button>
          <div className="text-right">
            {isTestMode && (
              <p className="text-xs text-orange-600 font-medium">TEST MODE: {testDate}</p>
            )}
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
              {currentBlock && localTimeRemaining !== null && (
                <CircularTimer 
                  durationMinutes={currentBlock.duration} 
                  isRunning={localTimerRunning} 
                  onComplete={handleTimerComplete} 
                  externalTimeRemaining={localTimeRemaining} 
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
                onClick={handleMarkComplete} 
                size="lg" 
                className="gap-3 bg-success text-success-foreground hover:bg-success/90 text-base font-semibold py-4"
              >
                <CheckCircle className="w-6 h-6" />
                Done!
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleNeedMoreTime} 
                size="lg" 
                className="gap-3 border-2 py-4 text-base font-semibold"
              >
                <Clock className="w-6 h-6" />
                More Time
              </Button>
            </div>

            {/* Stuck Button - Always available */}
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleStuck} 
                size="lg" 
                className="gap-3 text-orange-600 border-orange-300 hover:bg-orange-50 border-2 py-4 text-base font-semibold min-w-[200px]"
              >
                <AlertTriangle className="w-6 h-6" />
                I'm Stuck - Need Help
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-border/50">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentBlockIndex(prev => Math.max(0, prev - 1))} 
                disabled={!canGoPrev} 
                size="lg" 
                className="gap-3 text-base font-semibold py-4"
              >
                <ChevronLeft className="w-6 h-6" />
                Previous
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setCurrentBlockIndex(prev => Math.min(totalBlocks - 1, prev + 1))} 
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