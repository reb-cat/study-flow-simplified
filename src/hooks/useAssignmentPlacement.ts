import { useMemo } from 'react';
import { PopulatedScheduleBlock } from '@/types/schedule';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { SupabaseAssignment } from '@/hooks/useSupabaseAssignments';
import { detectFamily, getBlockFamily, isStudyHallBlock, shouldPrioritizeAlgebra } from '@/lib/family-detection';

interface AssignmentWithFamily extends SupabaseAssignment {
  detectedFamily: string;
}

/**
 * Hook to populate Assignment and Study Hall blocks with actual assignments
 * using Charlotte Mason family patterns
 */
export function useAssignmentPlacement(
  assignments: SupabaseAssignment[],
  scheduleBlocks: SupabaseScheduleBlock[],
  studentName: string,
  selectedDate: string
): {
  populatedBlocks: PopulatedScheduleBlock[];
  assignmentsWithFamily: AssignmentWithFamily[];
  unscheduledCount: number;
} {
  
  return useMemo(() => {
    // Add family detection to assignments
    const assignmentsWithFamily: AssignmentWithFamily[] = assignments.map(assignment => ({
      ...assignment,
      detectedFamily: detectFamily(assignment)
    }));

    // Get unscheduled assignments (no scheduled_date or scheduled_block)
    const unscheduledAssignments = assignmentsWithFamily.filter(a => 
      !a.scheduled_date && !a.scheduled_block
    );

    // Get Assignment and Study Hall blocks for processing
    const assignableBlocks = scheduleBlocks.filter(block => {
      const blockType = (block.block_type || '').toLowerCase();
      return blockType === 'assignment' || isStudyHallBlock(block.block_type, block.start_time);
    });

    // Create a map to track which assignments have been scheduled
    const scheduledAssignments = new Set<string>();
    
    // Process blocks and populate with assignments
    const populatedBlocks: PopulatedScheduleBlock[] = assignableBlocks.map(block => {
      const dayName = getDayName(selectedDate);
      const family = getBlockFamily(studentName, dayName, block.block_number || 0);
      
      if (!family) return { ...block, assignment: undefined, assignedFamily: undefined };

      // Special case: Khalil's Algebra priority
      if (shouldPrioritizeAlgebra(studentName, dayName, block.block_number || 0)) {
        const algebraAssignment = unscheduledAssignments.find(a => 
          !scheduledAssignments.has(a.id) &&
          ((a.subject || '').toLowerCase().includes('algebra') || 
           (a.course_name || '').toLowerCase().includes('algebra'))
        );
        
        if (algebraAssignment) {
          scheduledAssignments.add(algebraAssignment.id);
          return { 
            ...block, 
            assignment: algebraAssignment,
            assignedFamily: family
          };
        }
      }

      // Special case: Study Hall blocks prefer short tasks
      if (isStudyHallBlock(block.block_type, block.start_time)) {
        const shortTask = unscheduledAssignments.find(a => 
          !scheduledAssignments.has(a.id) &&
          a.detectedFamily === family &&
          isShortTask(a)
        );
        
        if (shortTask) {
          scheduledAssignments.add(shortTask.id);
          return { 
            ...block, 
            assignment: shortTask,
            assignedFamily: family
          };
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
        return { 
          ...block, 
          assignment: selectedAssignment,
          assignedFamily: family
        };
      }

      return { ...block, assignment: undefined, assignedFamily: family };
    });

    return {
      populatedBlocks,
      assignmentsWithFamily,
      unscheduledCount: unscheduledAssignments.length - scheduledAssignments.size
    };
    
  }, [assignments, scheduleBlocks, studentName, selectedDate]);
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