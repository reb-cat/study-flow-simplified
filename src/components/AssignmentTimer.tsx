import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentTimerProps {
  assignmentId: string;
  studentName: string;
  initialTimeSpent?: number;
}

export function AssignmentTimer({ assignmentId, studentName, initialTimeSpent = 0 }: AssignmentTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(initialTimeSpent);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start timer
  const startTimer = async () => {
    const now = new Date();
    setSessionStart(now);
    setIsRunning(true);

    // Create progress session
    await supabase.from('progress_sessions').insert({
      assignment_id: assignmentId,
      student_name: studentName,
      started_at: now.toISOString(),
      session_type: 'focus'
    });

    // Start interval for UI updates
    intervalRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    // Auto-save every minute
    autoSaveRef.current = setInterval(async () => {
      await saveTimeSpent();
    }, 60000);
  };

  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
    setSessionStart(null);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
      autoSaveRef.current = null;
    }

    saveTimeSpent();
  };

  // Stop timer and mark complete
  const stopTimer = async () => {
    pauseTimer();
    
    // Mark assignment as completed
    await supabase
      .from('assignments')
      .update({ 
        completion_status: 'completed',
        completed_at: new Date().toISOString(),
        time_spent: timeSpent
      })
      .eq('id', assignmentId);

    // Complete the progress session
    const sessionDuration = sessionStart ? 
      Math.floor((Date.now() - sessionStart.getTime()) / 1000) : 0;
    
    await supabase
      .from('progress_sessions')
      .update({
        completed_at: new Date().toISOString(),
        time_spent: sessionDuration
      })
      .eq('assignment_id', assignmentId)
      .is('completed_at', null);
  };

  // Save time spent to database
  const saveTimeSpent = async () => {
    await supabase
      .from('assignments')
      .update({ time_spent: timeSpent })
      .eq('id', assignmentId);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, []);

  // Auto-save when timeSpent changes significantly
  useEffect(() => {
    if (timeSpent > 0 && timeSpent % 60 === 0) {
      saveTimeSpent();
    }
  }, [timeSpent]);

  return (
    <div className="space-y-2">
      {/* Time Display */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-3 h-3" />
        <span className="font-mono">{formatTime(timeSpent)}</span>
        {isRunning && (
          <Badge variant="default" className="bg-timer text-timer-foreground">
            Running
          </Badge>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-1">
        {!isRunning ? (
          <Button size="sm" variant="outline" onClick={startTimer}>
            <Play className="w-3 h-3" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={pauseTimer}>
            <Pause className="w-3 h-3" />
          </Button>
        )}
        
        <Button size="sm" variant="outline" onClick={stopTimer}>
          <Square className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}