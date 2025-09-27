import { useMemo } from 'react';
import { PopulatedScheduleBlock } from '@/types/schedule';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import { detectFamily, getBlockFamily, isStudyHallBlock, shouldPrioritizeAlgebra, STUDY_HALL_FALLBACK } from '@/lib/family-detection';

interface AssignmentWithFamily extends UnifiedAssignment {
  detectedFamily: string;
}

/**
 * Hook to populate Assignment and Study Hall blocks with actual assignments
 * using Charlotte Mason family patterns
 */
export function useAssignmentPlacement(
  assignments: UnifiedAssignment[],
  scheduleBlocks: SupabaseScheduleBlock[],
  studentName: string,
  selectedDate: string
): {
  populatedBlocks: PopulatedScheduleBlock[];
  assignmentsWithFamily: AssignmentWithFamily[];
  unscheduledCount: number;
} {
  
  return useMemo(() => {
    console.log('=== ASSIGNMENT PLACEMENT DEBUG ===');
    console.log('Input assignments:', assignments);
    console.log('Input scheduleBlocks:', scheduleBlocks);
    console.log('Student:', studentName);
    console.log('Date:', selectedDate);

    // Add family detection to assignments
    const assignmentsWithFamily: AssignmentWithFamily[] = assignments.map(assignment => {
      const family = detectFamily(assignment);
      return {
        ...assignment,
        detectedFamily: family
      };
    });

    // Filter out completed assignments entirely - they shouldn't be placed in any blocks
    const activeAssignments = assignmentsWithFamily.filter(a => 
      a.completion_status !== 'completed'
    );
    
    console.log('Assignments with families:', activeAssignments.map(a => ({
      title: a.title,
      subject: a.subject,
      family: a.detectedFamily,
      scheduled_date: a.scheduled_date,
      scheduled_block: a.scheduled_block
    })));

    // Get unscheduled assignments (exclude scheduled and cleared assignments)
    // Note: Completed assignments are already filtered out above
    const unscheduledAssignments = activeAssignments.filter(a => {
      return !a.scheduled_date && !a.scheduled_block;
    });
    console.log('Unscheduled count:', unscheduledAssignments.length);

    // Get Assignment and Study Hall blocks for processing
    const assignableBlocks = scheduleBlocks.filter(block => {
      const blockType = (block.block_type || '');
      const isStudyHall = isStudyHallBlock(block.block_type, block.start_time, block.subject, block.block_name);
      return blockType === 'Assignment' || isStudyHall;
    });
    console.log('Assignable blocks:', assignableBlocks.map(b => ({
      block_type: b.block_type,
      block_number: b.block_number,
      subject: b.subject,
      block_name: b.block_name
    })));

    // Track which assignments have been scheduled to prevent duplicates
    const scheduledAssignments = new Set<string>();
    
    // Process blocks and populate with assignments
    const populatedBlocks: PopulatedScheduleBlock[] = [];
    
    // First, handle all assignable blocks (Assignment and Study Hall blocks)
    for (const block of assignableBlocks) {
      const dayName = getDayName(selectedDate);
      const family = getBlockFamily(studentName, dayName, block.block_number || 0);
      console.log(`Processing block ${block.block_number}: family="${family}"`);
      
      if (!family) {
        populatedBlocks.push({ ...block, assignment: undefined, assignedFamily: undefined });
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
          scheduledAssignments.add(algebraAssignment.id);
          populatedBlocks.push({ 
            ...block, 
            assignment: algebraAssignment,
            assignedFamily: family
          });
          continue;
        }
      }

      // Special case: Study Hall blocks prefer short tasks
      if (isStudyHallBlock(block.block_type, block.start_time, block.subject, block.block_name)) {
        const shortTask = unscheduledAssignments.find(a => 
          !scheduledAssignments.has(a.id) &&
          a.detectedFamily === family &&
          isShortTask(a)
        );
        
        if (shortTask) {
          scheduledAssignments.add(shortTask.id);
          populatedBlocks.push({ 
            ...block, 
            assignment: shortTask,
            assignedFamily: family
          });
          continue;
        } else {
          // Study Hall fallback when no short assignments available
          populatedBlocks.push({ 
            ...block, 
            assignment: undefined,
            assignedFamily: family,
            fallback: STUDY_HALL_FALLBACK
          });
          continue;
        }
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
        scheduledAssignments.add(selectedAssignment.id);
        populatedBlocks.push({ 
          ...block, 
          assignment: selectedAssignment,
          assignedFamily: family
        });
      } else {
        populatedBlocks.push({ ...block, assignment: undefined, assignedFamily: family });
      }
    }

    // Second pass: Add ALL remaining blocks (Co-op, Travel, Prep/Load, Bible, Lunch, Movement, etc.)
    for (const block of scheduleBlocks) {
      const alreadyProcessed = populatedBlocks.find(p => p.id === block.id);
      if (!alreadyProcessed) {
        // Add non-assignable blocks as-is (Co-op, Travel, Prep/Load, Bible, Lunch, Movement)
        populatedBlocks.push({
          ...block,
          assignment: undefined,
          assignedFamily: undefined
        });
      }
    }

    return {
      populatedBlocks: populatedBlocks.sort((a, b) => {
        // Sort by start_time to ensure proper chronological order
        const timeToMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
      }),
      assignmentsWithFamily: activeAssignments,
      unscheduledCount: unscheduledAssignments.length - scheduledAssignments.size
    };
    
  }, [
    assignments?.length, 
    JSON.stringify(assignments?.map(a => ({ id: a.id, title: a.title, course_name: a.course_name, scheduled_date: a.scheduled_date, scheduled_block: a.scheduled_block }))),
    scheduleBlocks?.length,
    JSON.stringify(scheduleBlocks?.map(b => ({ id: b.id, block_type: b.block_type, block_number: b.block_number, start_time: b.start_time }))),
    studentName, 
    selectedDate
  ]);
}

/**
 * Helper to get day name from date string
 */
function getDayName(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[date.getDay()];
}

/**
 * Helper to identify short tasks suitable for Study Hall
 */
function isShortTask(assignment: AssignmentWithFamily): boolean {
  const title = (assignment.title || '').toLowerCase();
  
  // Keywords that suggest short tasks
  const shortTaskKeywords = [
    'quiz', 'check', 'review', 'practice', 'worksheet', 'exercise',
    'question', 'problem', 'drill', 'vocab', 'vocabulary'
  ];
  
  return shortTaskKeywords.some(keyword => title.includes(keyword));
}