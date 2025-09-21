import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { FAMILY_PATTERNS, FALLBACKS, type Family, type Student, type WeekDay } from './scheduling-constants';
import { detectFamily, splitHistoryModule, requiresSpecialResources, type Assignment } from './family-detection';

export interface ScheduleBlock {
  id: string;
  student_name: string;
  weekday: string;
  block_number: number;
  start_time: string;
  end_time: string;
  subject: string;
  block_type: string;
  family?: Family;
  assignment?: Assignment | { title: string; minutes: number; family: Family; isFallback: true };
}

// Get assignments for a specific student that need scheduling
export async function getUnscheduledAssignments(supabase: any, student: Student): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', student)
    .is('scheduled_date', null)
    .neq('completion_status', 'completed')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }

  // Split history modules and detect families
  let assignments: Assignment[] = [];
  for (const assignment of data || []) {
    const splitAssignments = splitHistoryModule(assignment);
    for (const splitAssignment of splitAssignments) {
      splitAssignment.detected_family = detectFamily(splitAssignment);
      assignments.push(splitAssignment);
    }
  }

  return assignments;
}

// Get schedule template blocks for a specific day
export async function getScheduleBlocks(supabase: any, student: Student, weekday: WeekDay): Promise<ScheduleBlock[]> {
  const { data, error } = await supabase
    .from('schedule_template')
    .select('*')
    .eq('student_name', student)
    .eq('weekday', weekday)
    .eq('block_type', 'assignment')
    .order('block_number', { ascending: true });

  if (error) {
    console.error('Error fetching schedule blocks:', error);
    return [];
  }

  return data || [];
}

// Place assignments in schedule blocks following family patterns
export async function fillSchedule(supabase: any, student: Student, weekStart: Date) {
  const assignments = await getUnscheduledAssignments(supabase, student);
  const weekDays: WeekDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  for (let dayIndex = 0; dayIndex < weekDays.length; dayIndex++) {
    const day = weekDays[dayIndex];
    const currentDate = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
    const blocks = await getScheduleBlocks(supabase, student, day);
    const pattern = FAMILY_PATTERNS[student][day];
    
    if (!pattern) continue;

    for (let blockIndex = 0; blockIndex < blocks.length && blockIndex < pattern.length; blockIndex++) {
      const block = blocks[blockIndex];
      const family = pattern[blockIndex];
      
      if (family === "Study Hall") {
        await placeStudyHallTask(supabase, block, assignments, currentDate);
        continue;
      }

      // Find next assignment matching this family
      const matching = assignments
        .filter(a => !a.scheduled_date && a.detected_family === family)
        .sort((a, b) => {
          const dueDateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dueDateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return dueDateA - dueDateB;
        });

      if (matching.length > 0) {
        const assignment = matching[0];
        
        // Special rule: Khalil's Algebra priority on Mon/Wed before 3:30pm
        if (student === "Khalil" && (day === "Monday" || day === "Wednesday")) {
          const blockTime = block.start_time;
          if (blockTime < "15:30" && family === "Analytical") {
            const algebraAssignment = matching.find(a => 
              a.course_name?.includes("Algebra") || a.subject?.includes("Algebra")
            );
            if (algebraAssignment) {
              await scheduleAssignment(supabase, algebraAssignment, currentDate, block.block_number);
              continue;
            }
          }
        }

        await scheduleAssignment(supabase, assignment, currentDate, block.block_number);
      }
    }
  }
}

// Place short tasks in Study Hall blocks
async function placeStudyHallTask(supabase: any, block: ScheduleBlock, assignments: Assignment[], date: string) {
  // Prefer short tasks that don't need special resources
  const candidates = assignments
    .filter(a => !a.scheduled_date)
    .filter(a => (a.actual_estimated_minutes || 30) <= 25)
    .filter(a => !requiresSpecialResources(a))
    .sort((a, b) => {
      const dueDateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const dueDateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return dueDateA - dueDateB;
    });

  if (candidates.length > 0) {
    await scheduleAssignment(supabase, candidates[0], date, block.block_number);
  }
}

// Schedule an assignment to a specific date and block
async function scheduleAssignment(supabase: any, assignment: Assignment, date: string, blockNumber: number) {
  const { error } = await supabase
    .from('assignments')
    .update({ 
      scheduled_date: date, 
      scheduled_block: blockNumber,
      detected_family: assignment.detected_family 
    })
    .eq('id', assignment.id);

  if (error) {
    console.error('Error scheduling assignment:', error);
  } else {
    assignment.scheduled_date = date;
    assignment.scheduled_block = blockNumber;
  }
}

// Get fallback content for a family
export function getFallback(family: Family) {
  const fallback = FALLBACKS[family];
  
  if (Array.isArray(fallback)) {
    const randomFallback = fallback[Math.floor(Math.random() * fallback.length)];
    return { ...randomFallback, family, isFallback: true };
  }
  
  return { ...fallback, family, isFallback: true };
}