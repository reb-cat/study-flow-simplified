import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, Clock, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { FAMILY_PATTERNS, FAMILY_COLORS, type Student, type WeekDay } from '@/lib/scheduling-constants';
import { detectFamily, type Assignment } from '@/lib/family-detection';

interface ParentWeeklySetupProps {
  student: Student;
}

interface UnscheduledAssignment extends Assignment {
  urgency: 'overdue' | 'today' | 'tomorrow' | 'thisweek' | 'upcoming';
}

export function ParentWeeklySetup({ student }: ParentWeeklySetupProps) {
  const [setupWeek, setSetupWeek] = useState(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }));
  const [unscheduledAssignments, setUnscheduledAssignments] = useState<UnscheduledAssignment[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  const weekDays: WeekDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Load unscheduled assignments
  const loadUnscheduledAssignments = async () => {
    const today = new Date();
    const fiveDaysFromNow = addDays(today, 5);

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', student)
      .is('scheduled_date', null)
      .neq('completion_status', 'completed')
      .lte('due_date', fiveDaysFromNow.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error loading assignments:', error);
      return;
    }

    // Categorize by urgency and detect families
    const categorized = (data || []).map(assignment => {
      const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
      let urgency: UnscheduledAssignment['urgency'] = 'upcoming';

      if (dueDate) {
        if (dueDate < today) urgency = 'overdue';
        else if (dueDate.toDateString() === today.toDateString()) urgency = 'today';
        else if (dueDate.toDateString() === addDays(today, 1).toDateString()) urgency = 'tomorrow';
        else if (dueDate <= addDays(today, 7)) urgency = 'thisweek';
      }

      return {
        ...assignment,
        urgency,
        detected_family: assignment.detected_family || detectFamily(assignment)
      } as UnscheduledAssignment;
    });

    setUnscheduledAssignments(categorized);
  };

  // Load current week schedule
  const loadWeekSchedule = async () => {
    const schedule: Record<string, any[]> = {};

    for (let dayIndex = 0; dayIndex < weekDays.length; dayIndex++) {
      const day = weekDays[dayIndex];
      const currentDate = format(addDays(setupWeek, dayIndex), 'yyyy-MM-dd');
      
      // Get schedule blocks
      const { data: blocks } = await supabase
        .from('schedule_template')
        .select('*')
        .eq('student_name', student)
        .eq('weekday', day)
        .eq('block_type', 'assignment')
        .order('block_number', { ascending: true });

      // Get already scheduled assignments
      const { data: scheduled } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', student)
        .eq('scheduled_date', currentDate);

      const dayBlocks = (blocks || []).map(block => {
        const pattern = FAMILY_PATTERNS[student][day] || [];
        const family = pattern[block.block_number - 1];
        const assignment = scheduled?.find(a => a.scheduled_block === block.block_number);

        return {
          ...block,
          family,
          assignment,
          date: currentDate
        };
      });

      schedule[day] = dayBlocks;
    }

    setWeekSchedule(schedule);
  };

  // Handle assignment drag and drop
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Parse destination info
    const [day, blockIndex] = destination.droppableId.split('-');
    const block = weekSchedule[day]?.[parseInt(blockIndex)];
    if (!block) return;

    // Get assignment being moved
    const assignment = unscheduledAssignments.find(a => a.id === result.draggableId);
    if (!assignment) return;

    // Schedule the assignment
    const { error } = await supabase
      .from('assignments')
      .update({
        scheduled_date: block.date,
        scheduled_block: block.block_number,
        detected_family: assignment.detected_family
      })
      .eq('id', assignment.id);

    if (!error) {
      // Refresh data
      await loadUnscheduledAssignments();
      await loadWeekSchedule();
    }
  };

  // Remove assignment from schedule
  const unscheduleAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from('assignments')
      .update({
        scheduled_date: null,
        scheduled_block: null
      })
      .eq('id', assignmentId);

    if (!error) {
      await loadUnscheduledAssignments();
      await loadWeekSchedule();
    }
  };

  // Add enrichments to assignment
  const updateAssignmentEnrichments = async (assignmentId: string, updates: Partial<Assignment>) => {
    const { error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', assignmentId);

    if (!error) {
      await loadWeekSchedule();
    }
  };

  useEffect(() => {
    loadUnscheduledAssignments();
    loadWeekSchedule();
  }, [setupWeek, student]);

  const getUrgencyColor = (urgency: UnscheduledAssignment['urgency']) => {
    switch (urgency) {
      case 'overdue': return 'hsl(var(--destructive))';
      case 'today': return 'hsl(var(--timer))';
      case 'tomorrow': return 'hsl(var(--primary))';
      case 'thisweek': return 'hsl(var(--success))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Weekly Setup - {student}
          </h2>
          <div className="text-sm text-muted-foreground">
            Week of {format(setupWeek, 'MMM d, yyyy')}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unscheduled Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assignments to Schedule</h3>
            
            <Droppable droppableId="unscheduled" type="assignment">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {unscheduledAssignments.map((assignment, index) => (
                    <Draggable 
                      key={assignment.id} 
                      draggableId={assignment.id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Card 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 space-y-2 cursor-move ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getUrgencyColor(assignment.urgency) }}
                            />
                            <Badge 
                              variant="outline" 
                              style={{ 
                                borderColor: FAMILY_COLORS[assignment.detected_family as keyof typeof FAMILY_COLORS],
                                color: FAMILY_COLORS[assignment.detected_family as keyof typeof FAMILY_COLORS]
                              }}
                            >
                              {assignment.detected_family}
                            </Badge>
                          </div>

                          <h4 className="font-medium text-sm">{assignment.title}</h4>
                          <div className="text-xs text-muted-foreground">
                            {assignment.course_name} • Due: {
                              assignment.due_date ? format(new Date(assignment.due_date), 'MMM d') : 'No date'
                            }
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Week Schedule */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold">Week Schedule</h3>
            
            <div className="grid grid-cols-5 gap-3">
              {weekDays.map((day) => (
                <div key={day} className="space-y-2">
                  <h4 className="font-medium text-center text-sm bg-muted p-2 rounded">
                    {day}
                  </h4>
                  
                  {(weekSchedule[day] || []).map((block, blockIndex) => (
                    <Droppable 
                      key={`${day}-${blockIndex}`}
                      droppableId={`${day}-${blockIndex}`}
                      type="assignment"
                    >
                      {(provided, snapshot) => (
                        <Card 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-2 min-h-[80px] ${
                            snapshot.isDraggingOver ? 'bg-primary/10 border-primary' : ''
                          }`}
                        >
                          <div className="text-xs text-center mb-2">
                            {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                          </div>
                          
                          <div className="flex items-center justify-center mb-2">
                            <Badge variant="outline" className="text-xs">
                              {block.family}
                            </Badge>
                          </div>

                          {block.assignment ? (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-center">
                                {block.assignment.title}
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="w-full h-6 text-xs"
                                onClick={() => unscheduleAssignment(block.assignment.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground text-center">
                              Drop assignment here
                            </div>
                          )}
                          
                          {provided.placeholder}
                        </Card>
                      )}
                    </Droppable>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}