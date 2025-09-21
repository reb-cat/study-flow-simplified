import { useMemo } from 'react';
import { Assignment } from '@/types';
import { PopulatedScheduleBlock } from '@/types/schedule';
import { detectFamily, getBlockFamily, isStudyHallBlock, shouldPrioritizeAlgebra } from '@/lib/family-detection';

interface AssignmentWithFamily extends Assignment {
  detectedFamily: string;
}

/**
 * Hook to populate Assignment and Study Hall blocks with actual assignments
 * using Charlotte Mason family patterns
 */
export function useAssignmentPlacement(
  assignments: Assignment[],
  scheduleBlocks: any[], // Using any to avoid complex typing issues
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
      !a.scheduledDate && !a.scheduledBlock
    );

    // Get Assignment and Study Hall blocks for processing
    const assignableBlocks = scheduleBlocks.filter(block => {
      const blockType = (block.blockType || '').toLowerCase();
      return blockType === 'assignment' || isStudyHallBlock(block.blockType, block.startTime);
    });

    // Create a map to track which assignments have been scheduled
    const scheduledAssignments = new Set<string>();
    
    // Process blocks and populate with assignments
    const populatedBlocks: PopulatedScheduleBlock[] = assignableBlocks.map(block => {
      const dayName = getDayName(selectedDate);
      const family = getBlockFamily(studentName, dayName, block.blockNumber || 0);
      
      if (!family) return { ...block, assignment: undefined, assignedFamily: undefined };

      // Special case: Khalil's Algebra priority
      if (shouldPrioritizeAlgebra(studentName, dayName, block.blockNumber || 0)) {
        const algebraAssignment = unscheduledAssignments.find(a => 
          !scheduledAssignments.has(a.id) &&
          (a.subject || '').toLowerCase().includes('algebra')
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
      if (isStudyHallBlock(block.blockType, block.startTime)) {
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
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
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