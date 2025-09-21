import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { fillSchedule, getFallback, type ScheduleBlock } from '@/lib/schedule-filler';
import { FAMILY_COLORS, FAMILY_PATTERNS, type Student, type WeekDay, type Family } from '@/lib/scheduling-constants';
import { type Assignment } from '@/lib/family-detection';
import { AssignmentTimer } from './AssignmentTimer';

interface ScheduleViewProps {
  student: Student;
}

export function ScheduleView({ student }: ScheduleViewProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekSchedule, setWeekSchedule] = useState<Record<string, ScheduleBlock[]>>({});
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [loading, setLoading] = useState(false);

  const weekDays: WeekDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Load schedule data
  const loadSchedule = async () => {
    setLoading(true);
    try {
      const schedule: Record<string, ScheduleBlock[]> = {};
      const assignmentMap: Record<string, Assignment> = {};

      for (let dayIndex = 0; dayIndex < weekDays.length; dayIndex++) {
        const day = weekDays[dayIndex];
        const currentDate = format(addDays(currentWeek, dayIndex), 'yyyy-MM-dd');
        
        // Get schedule template blocks
        const { data: blocks } = await supabase
          .from('schedule_template')
          .select('*')
          .eq('student_name', student)
          .eq('weekday', day)
          .order('block_number', { ascending: true });

        // Get scheduled assignments for this date
        const { data: scheduledAssignments } = await supabase
          .from('assignments')
          .select('*')
          .eq('user_id', student)
          .eq('scheduled_date', currentDate);

        const dayBlocks = (blocks || []).map((block: ScheduleBlock) => {
          const pattern = FAMILY_PATTERNS[student][day] || [];
          const family = pattern[block.block_number - 1] as Family;
          
          if (block.block_type === 'assignment') {
            // Find assigned work for this block
            const assignment = scheduledAssignments?.find(
              (a: Assignment) => a.scheduled_block === block.block_number
            );

            if (assignment) {
              assignmentMap[assignment.id] = assignment;
              return {
                ...block,
                family,
                assignment
              };
            } else {
              // Use fallback content
              return {
                ...block,
                family,
                assignment: getFallback(family)
              };
            }
          }

          return { ...block, family };
        });

        schedule[day] = dayBlocks;
      }

      setWeekSchedule(schedule);
      setAssignments(assignmentMap);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
    setLoading(false);
  };

  // Auto-fill schedule
  const handleAutoFill = async () => {
    setLoading(true);
    try {
      await fillSchedule(supabase, student, currentWeek);
      await loadSchedule(); // Reload to show changes
    } catch (error) {
      console.error('Error auto-filling schedule:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSchedule();
  }, [currentWeek, student]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return `${diffMinutes}min`;
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            Week of {format(currentWeek, 'MMM d, yyyy')} - {student}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <Button onClick={handleAutoFill} disabled={loading}>
          {loading ? 'Filling...' : 'Auto-Fill Schedule'}
        </Button>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {weekDays.map((day, dayIndex) => {
          const dayBlocks = weekSchedule[day] || [];
          const currentDate = addDays(currentWeek, dayIndex);

          return (
            <div key={day} className="space-y-3">
              <h3 className="font-medium text-center py-2 bg-muted rounded">
                {day}
                <br />
                <span className="text-sm text-muted-foreground">
                  {format(currentDate, 'MMM d')}
                </span>
              </h3>

              {dayBlocks.map((block) => (
                <Card key={block.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {formatTime(block.start_time)} - {formatTime(block.end_time)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDuration(block.start_time, block.end_time)}
                    </span>
                  </div>

                  {block.block_type === 'assignment' ? (
                    <AssignmentBlock block={block} student={student} />
                  ) : (
                    <div className="text-center py-2">
                      <Badge variant="secondary">{block.subject}</Badge>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Individual assignment block component
function AssignmentBlock({ block, student }: { block: ScheduleBlock; student: Student }) {
  const assignment = block.assignment;
  if (!assignment) return null;

  const familyColor = block.family ? FAMILY_COLORS[block.family] : 'hsl(var(--muted-foreground))';
  const isRealAssignment = 'id' in assignment;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: familyColor }}
        />
        <Badge variant="outline" className="text-xs">
          {block.family}
        </Badge>
      </div>

      <div className="space-y-1">
        <h4 className="font-medium text-sm leading-tight">
          {assignment.title}
        </h4>
        
        {isRealAssignment && (
          <div className="text-xs text-muted-foreground">
            {assignment.course_name || assignment.subject}
          </div>
        )}
      </div>

      {isRealAssignment ? (
        <AssignmentTimer 
          assignmentId={assignment.id} 
          studentName={student}
          initialTimeSpent={assignment.time_spent || 0}
        />
      ) : (
        <div className="text-xs text-muted-foreground">
          {assignment.minutes} min • Enrichment
        </div>
      )}
    </div>
  );
}