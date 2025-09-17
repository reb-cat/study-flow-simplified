import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface CircularTimerProps {
  durationMinutes: number;
  isRunning: boolean;
  onComplete?: () => void;
  onToggle?: () => void;
  onReset?: () => void;
  extraTime?: number;
  hideControls?: boolean;
  externalTimeRemaining?: number; // Use external time state
  onTimeUpdate?: (timeRemaining: number) => void;
  className?: string;
}
export function CircularTimer({
  durationMinutes,
  isRunning,
  onComplete,
  onToggle,
  onReset,
  extraTime = 0,
  hideControls = false,
  externalTimeRemaining,
  className = ""
}: CircularTimerProps) {
  const totalSeconds = durationMinutes * 60 + extraTime * 60;

  // Use external time state if provided, otherwise manage internally
  const [internalTimeRemaining, setInternalTimeRemaining] = useState(totalSeconds);
  const timeRemaining = externalTimeRemaining !== undefined ? externalTimeRemaining : internalTimeRemaining;

  // Gentle completion chime using Web Audio API
  const playCompletionChime = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sine';

        // Gentle fade in and out
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      const now = audioContext.currentTime;
      // Two-tone gentle chime: C5 -> G5 (pleasant, supportive)
      playTone(523.25, now, 0.8); // C5
      playTone(783.99, now + 0.4, 0.8); // G5
    } catch (error) {
      console.log('Audio not available:', error);
    }
  };

  // Only manage internal timer if no external time is provided
  useEffect(() => {
    if (externalTimeRemaining === undefined) {
      setInternalTimeRemaining(totalSeconds);
    }
  }, [totalSeconds, externalTimeRemaining]);

  // Only run internal countdown if no external time is provided
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (externalTimeRemaining === undefined && isRunning && internalTimeRemaining > 0) {
      interval = setInterval(() => {
        setInternalTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            playCompletionChime();
            onComplete?.();
            return 0;
          }
          return newTime;
        });
      }, 1000); // EXACTLY 1000ms = 1 real second
    }
    return () => clearInterval(interval);
  }, [isRunning, internalTimeRemaining, onComplete, externalTimeRemaining]);

  // Trigger completion when external timer reaches 0
  useEffect(() => {
    if (externalTimeRemaining !== undefined && externalTimeRemaining === 0) {
      playCompletionChime();
      onComplete?.();
    }
  }, [externalTimeRemaining, onComplete]);
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const progress = totalSeconds > 0 ? timeRemaining / totalSeconds * 100 : 0;
  const radius = 120;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - progress / 100 * circumference;

  // Dynamic color based on time remaining
  const getTimerColor = () => {
    return 'text-success'; // Always green
  };
  const isCompleted = timeRemaining === 0;
  return <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Circular Progress Timer */}
      <div className="relative animate-scale-in">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Background circle */}
          <circle stroke="currentColor" className="text-muted/30" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
          
          {/* Progress circle */}
          <circle stroke="currentColor" className={`transition-all duration-1000 ease-linear ${getTimerColor()}`} fill="transparent" strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} style={{
          filter: isCompleted ? 'drop-shadow(0 0 8px hsl(var(--success)))' : undefined
        }} />
        </svg>
        
        {/* Time display in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {isCompleted ? <div className="animate-scale-in">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-2" />
                <div className="text-lg font-semibold text-success">Complete!</div>
              </div> : <>
                <div className={`text-5xl font-bold transition-colors ${timeRemaining <= 10 ? 'animate-pulse text-timer' : 'text-foreground'}`}>
                  {formatTime(timeRemaining)}
                </div>
                {extraTime > 0 && <div className="text-sm text-muted-foreground mt-1">
                    +{extraTime} min extra
                  </div>}
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(progress)}% remaining
                </div>
              </>}
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      {!hideControls && <div className="flex items-center gap-4">
          <Button variant="outline" size="lg" onClick={onToggle} className="gap-2 hover-scale border-2 font-medium py-3 px-6" disabled={isCompleted}>
            {isRunning ? <>
                <Pause className="w-5 h-5" />
                Pause
              </> : <>
                <Play className="w-5 h-5" />
                {timeRemaining === totalSeconds ? 'Start' : 'Resume'}
              </>}
          </Button>
          
          
        </div>}

      {/* Time Status Indicators */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {timeRemaining > 300 && <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-success rounded-full" />
            On Track
          </div>}
        {timeRemaining <= 300 && timeRemaining > 60 && <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            Almost Done
          </div>}
        {timeRemaining <= 60 && timeRemaining > 0 && <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-timer" />
            Final Minute
          </div>}
      </div>
    </div>;
}