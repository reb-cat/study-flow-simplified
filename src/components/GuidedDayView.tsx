import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CircularTimer } from './CircularTimer';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, BookOpen, ArrowLeft, AlertTriangle, Target, ExternalLink } from 'lucide-react';
import { Assignment } from '@/types';
import { toast } from '@/hooks/use-toast';
interface GuidedDayViewProps {
  onBackToHub: () => void;
  selectedDate: string;
}
export const GuidedDayView: React.FC<GuidedDayViewProps> = ({
  onBackToHub,
  selectedDate
}) => {
  const {
    selectedProfile,
    getAssignmentsForProfile,
    getScheduleForStudent,
    updateAssignment,
    startTimer,
    pauseTimer,
    stopTimer,
    activeTimer
  } = useApp();
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [localTimerRunning, setLocalTimerRunning] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number | null>(null);

  // Helper function - defined early to avoid hoisting issues
  const calculateBlockDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return Math.max(1, endMinutes - startMinutes);
  };
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  if (!selectedProfile) {
    return <div>Loading...</div>;
  }

  // Get today's schedule and assignments
  const profileAssignments = getAssignmentsForProfile(selectedProfile.id);
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const weekday = selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay();
  const daySchedule = getScheduleForStudent(selectedProfile.displayName, weekday);

  // Get assignments for today
  const todaysAssignments = profileAssignments.filter(a => a.scheduledDate === selectedDate);

  // Build guided blocks combining schedule and assignments
  const guidedBlocks = daySchedule.map(block => {
    const blockAssignments = todaysAssignments.filter(a => a.scheduledBlock === block.blockNumber);
    const assignment = blockAssignments[0]; // Take first assignment for this block

    return {
      id: block.id,
      blockNumber: block.blockNumber,
      startTime: block.startTime,
      endTime: block.endTime,
      subject: block.subject,
      blockType: block.blockType,
      assignment: assignment || null,
      duration: calculateBlockDuration(block.startTime, block.endTime)
    };
  }).filter(block => {
    const blockType = block.blockType?.toLowerCase() || '';
    // Only show assignment blocks and important activities
    return blockType === 'assignment' || blockType === 'bible' || ['lunch', 'movement'].includes(blockType);
  });
  const currentBlock = guidedBlocks[currentBlockIndex];
  const totalBlocks = guidedBlocks.length;

  // Initialize timer when block changes
  useEffect(() => {
    if (currentBlock) {
      const totalSeconds = currentBlock.duration * 60;
      setLocalTimeRemaining(totalSeconds);
      setLocalTimerRunning(false);
    }
  }, [currentBlock]);

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
  const handleTimerToggle = () => {
    if (!currentBlock) return;
    if (localTimerRunning) {
      setLocalTimerRunning(false);
      toast({
        title: "Timer paused ⏸️",
        description: "Take your time!"
      });
    } else {
      setLocalTimerRunning(true);
      toast({
        title: "Timer started! 🎯",
        description: "You've got this!"
      });
    }
  };
  const handleTimerReset = () => {
    if (currentBlock) {
      const totalSeconds = currentBlock.duration * 60;
      setLocalTimeRemaining(totalSeconds);
      setLocalTimerRunning(false);
      toast({
        title: "Timer reset 🔄",
        description: "Ready to start fresh!"
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
        return Clock;
      case 'movement':
        return Clock;
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
      default:
        return 'text-muted-foreground';
    }
  };
  if (!currentBlock) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">All Done! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              You've completed all your blocks for today. Great work!
            </p>
            <Button onClick={onBackToHub} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Mission Hub
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  const BlockIcon = getBlockTypeIcon(currentBlock.blockType || '');
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-2xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBackToHub} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Guided Day</h1>
            <p className="text-muted-foreground">
              Block {currentBlockIndex + 1} of {totalBlocks}
            </p>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={currentBlockIndex / Math.max(1, totalBlocks - 1) * 100} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            {Math.round(currentBlockIndex / Math.max(1, totalBlocks - 1) * 100)}% through your day
          </p>
        </div>

        {/* Current Block Card */}
        <Card className="card-elevated border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              
              <Badge variant="outline" className="text-sm">
                {currentBlock.startTime} - {currentBlock.endTime}
              </Badge>
            </div>
            <CardTitle className="text-xl">
              {currentBlock.assignment?.title || currentBlock.subject}
            </CardTitle>
            <p className="text-muted-foreground">
              {currentBlock.blockType} • {formatTime(currentBlock.duration)}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Timer */}
            <div className="flex justify-center">
              {currentBlock && localTimeRemaining !== null && <CircularTimer durationMinutes={currentBlock.duration} isRunning={localTimerRunning} onComplete={handleTimerComplete} onToggle={handleTimerToggle} onReset={handleTimerReset} externalTimeRemaining={localTimeRemaining} className="" />}
            </div>

            {/* Assignment Details */}
            {currentBlock.assignment && <Card className="bg-muted/30 border-none">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-medium">Assignment Details</span>
                  </div>
                  
                  {currentBlock.assignment.subject && <p className="text-sm">
                      <strong>Subject:</strong> {currentBlock.assignment.subject}
                    </p>}
                  
                  {currentBlock.assignment.dueDate && <p className="text-sm">
                      <strong>Due:</strong> {new Date(currentBlock.assignment.dueDate).toLocaleDateString()}
                    </p>}

                  {currentBlock.assignment.canvasUrl && <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={currentBlock.assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                        Open in Canvas
                      </a>
                    </Button>}
                </CardContent>
              </Card>}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={handleMarkComplete} size="lg" className="gap-2 bg-success text-success-foreground hover:bg-success/90 font-medium py-3">
                <CheckCircle className="w-5 h-5" />
                Done!
              </Button>
              
              <Button variant="outline" onClick={handleNeedMoreTime} size="lg" className="gap-2 border-2 py-3 font-medium">
                <Clock className="w-5 h-5" />
                More Time
              </Button>
            </div>

            {/* Stuck Button - Separate for emphasis */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleStuck} size="lg" className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50 border-2 py-3 font-medium min-w-[200px]">
                <AlertTriangle className="w-5 h-5" />
                I'm Stuck - Need Help
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-border/50">
              <Button variant="ghost" onClick={() => setCurrentBlockIndex(prev => Math.max(0, prev - 1))} disabled={!canGoPrev} size="lg" className="gap-2 font-medium">
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>

              <Button variant="ghost" onClick={() => setCurrentBlockIndex(prev => Math.min(totalBlocks - 1, prev + 1))} disabled={!canGoNext} size="lg" className="gap-2 font-medium">
                Next
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};