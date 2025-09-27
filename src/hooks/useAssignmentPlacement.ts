import { useMemo } from 'react';
import { PopulatedScheduleBlock } from '@/types/schedule';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import {
  detectFamily,
  getBlockFamily,
  isStudyHallBlock,
  shouldPrioritizeAlgebra,
  STUDY_HALL_FALLBACK
} from '@/lib/family-detection';

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
  // Short-circuit if data isn't ready to prevent fallbacks on empty dataset
  if (!assignments?.length || !scheduleBlocks?.length) {
    return useMemo(() => ({
      populatedBlocks: [],
      assignmentsWithFamily: [],
      unscheduledCount: 0
    }), [assignments?.length, scheduleBlocks?.length]);
  }

  return useMemo(() => {
    console.log('=== ASSIGNMENT PLACEMENT DEBUG ===');
    console.log('Input assignments:', assignments);
    console.log('Input scheduleBlocks:', scheduleBlocks);
    console.log('Student:', studentName);
    console.log('Date:', selectedDate);

    // Add family detection to assignments
    const assignmentsWithFamily: AssignmentWithFamily[] = (assignments || []).map(assignment => {
      const family = detectFamily(assignment);
      return {
        ...assignment,
        detectedFamily: family
      };
    });

    // Filter out completed assignments entirely - they shouldn't be placed in any blocks
    const activeAssignments = assignmentsWithFamily.filter(a => a.completion_status !== 'completed');

    // Check if any *active* (not completed) assignments exist
    const hasRealAssignments = activeAssignments.length > 0;
    console.log('Has real assignments (active, not completed):', hasRealAssignments);

    console.log(
      'Assignments with families:',
      activeAssignments.map(a => ({
        title: a.title,
        subject: a.subject,
        family: a.detectedFamily,
        scheduled_date: a.scheduled_date,
        scheduled_block: a.scheduled_block
      }))
    );

    // Less restrictive unscheduled filter:
    // - Ignore scheduled_date (old dates shouldn't block rescheduling)
    // - Only exclude if actively in a block today (scheduled_block set)
    // - Include items with no due date
    // - Include items due within next 30 days (or overdue)
    const unscheduledAssignments = activeAssignments
      .filter(a => {
        if (a.scheduled_block && a.scheduled_date === selectedDate) return false; // only treat as placed if it's for today
        if (!a.due_date) return true;

        const dueDate = new Date(a.due_date);
        const today = new Date();
        const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Include if due soon OR overdue
        return dueDate <= thirtyDaysOut;
      })
      .sort((a, b) => {
        // Prioritize overdue and soon-due assignments
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;

        const aDate = new Date(a.due_date).getTime();
        const bDate = new Date(b.due_date).getTime();
        const now = Date.now();

        // Overdue assignments first
        if (aDate < now && bDate >= now) return -1;
        if (bDate < now && aDate >= now) return 1;

        return aDate - bDate;
      });

    console.log('Unscheduled assignments after filtering:', unscheduledAssignments.length);
    console.log('Unscheduled count:', unscheduledAssignments.length);

    // Get Assignment and Study Hall blocks for processing
    const assignableBlocks = (scheduleBlocks || []).filter(block => {
      const blockType = block.block_type || '';
      const isStudyHall = isStudyHallBlock(block.block_type, block.start_time, block.subject, block.block_name);
      return blockType === 'Assignment' || isStudyHall;
    });

    console.log(
      'Assignable blocks:',
      assignableBlocks.map(b => ({
        block_type: b.block_type,
        block_number: b.block_number,
        subject: b.subject,
        block_name: b.block_name
      }))
    );

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
        const algebraAssignment = unscheduledAssignments.find(
          a =>
            !scheduledAssignments.has(a.id) &&
            ((a.subject || '').toLowerCase().includes('algebra') ||
              (a.course_name || '').toLowerCase().includes('algebra'))
        );

        if (algebraAssignment) {
          // Skip all completed assignments that are older than 24 hours
          if (algebraAssignment.completion_status === 'completed') {
            const completedTime = algebraAssignment.completed_at ? new Date(algebraAssignment.completed_at).getTime() : 0;
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            if (completedTime < oneDayAgo) {
              // Skip this assignment entirely, don't add to block
            } else {
              scheduledAssignments.add(algebraAssignment.id);
              populatedBlocks.push({
                ...block,
                assignment: algebraAssignment,
                assignedFamily: family
              });
              continue;
            }
          } else {
            scheduledAssignments.add(algebraAssignment.id);
            populatedBlocks.push({
              ...block,
              assignment: algebraAssignment,
              assignedFamily: family
            });
            continue;
          }
        }
      }

      // Special case: Study Hall blocks prefer short tasks
      if (isStudyHallBlock(block.block_type, block.start_time, block.subject, block.block_name)) {
        const shortTask = unscheduledAssignments.find(
          a => !scheduledAssignments.has(a.id) && a.detectedFamily === family && isShortTask(a)
        );

        if (shortTask) {
          // Skip all completed assignments that are older than 24 hours
          if (shortTask.completion_status === 'completed') {
            const completedTime = shortTask.completed_at ? new Date(shortTask.completed_at).getTime() : 0;
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            if (completedTime < oneDayAgo) {
              // Skip this assignment entirely, fall through to fallback
            } else {
              scheduledAssignments.add(shortTask.id);
              populatedBlocks.push({
                ...block,
                assignment: shortTask,
                assignedFamily: family
              });
              continue;
            }
          } else {
            scheduledAssignments.add(shortTask.id);
            populatedBlocks.push({
              ...block,
              assignment: shortTask,
              assignedFamily: family
            });
            continue;
          }
        }

        // Study Hall fallback
        if (!hasRealAssignments) {
          // Only if NO real assignments exist at all
          populatedBlocks.push({
            ...block,
            assignment: undefined,
            assignedFamily: family,
            fallback: STUDY_HALL_FALLBACK
          });
        } else {
          // If real assignments exist, try to find ANY pending assignment (do NOT exclude by scheduled_date)
          const urgentAssignment = unscheduledAssignments.find(
            a => !scheduledAssignments.has(a.id) && a.completion_status === 'pending'
          );

          if (urgentAssignment) {
            scheduledAssignments.add(urgentAssignment.id);
            populatedBlocks.push({
              ...block,
              assignment: urgentAssignment,
              assignedFamily: family
            });
          } else {
            // No assignments available, leave block empty
            populatedBlocks.push({
              ...block,
              assignment: undefined,
              assignedFamily: family
            });
          }
        }
        continue;
      }

      // Regular assignment matching by family
      const matchingAssignments = unscheduledAssignments
        .filter(a => !scheduledAssignments.has(a.id) && a.detectedFamily === family)
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
        // Skip all completed assignments that are older than 24 hours
        if (selectedAssignment.completion_status === 'completed') {
          const completedTime = selectedAssignment.completed_at ? new Date(selectedAssignment.completed_at).getTime() : 0;
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          if (completedTime < oneDayAgo) {
            // Skip this assignment entirely, fall through to no assignment
            populatedBlocks.push({ ...block, assignment: undefined, assignedFamily: family });
          } else {
            scheduledAssignments.add(selectedAssignment.id);
            populatedBlocks.push({
              ...block,
              assignment: selectedAssignment,
              assignedFamily: family
            });
          }
        } else {
          scheduledAssignments.add(selectedAssignment.id);
          populatedBlocks.push({
            ...block,
            assignment: selectedAssignment,
            assignedFamily: family
          });
        }
      } else {
        // If no family-specific assignment found and real assignments exist, try ANY pending assignment
        const urgentAssignment = hasRealAssignments
          ? unscheduledAssignments.find(a => !scheduledAssignments.has(a.id) && a.completion_status === 'pending')
          : undefined;

        if (urgentAssignment) {
          scheduledAssignments.add(urgentAssignment.id);
          populatedBlocks.push({
            ...block,
            assignment: urgentAssignment,
            assignedFamily: family
          });
        } else {
          populatedBlocks.push({ ...block, assignment: undefined, assignedFamily: family });
        }
      }
    }

    // Second pass: Add ALL remaining blocks (Co-op, Travel, Prep/Load, Bible, Lunch, Movement, etc.)
    for (const block of scheduleBlocks || []) {
      const alreadyProcessed = populatedBlocks.find(p => p.id === block.id);
      if (!alreadyProcessed) {
        // Add non-assignable blocks as-is
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
      // Make robust to avoid negatives
      unscheduledCount: Math.max(0, unscheduledAssignments.length - scheduledAssignments.size)
    };
  }, [
    assignments?.length,
    JSON.stringify(
      assignments?.map(a => ({
        id: a.id,
        title: a.title,
        course_name: a.course_name,
        scheduled_date: a.scheduled_date,
        scheduled_block: a.scheduled_block
      })) || []
    ),
    scheduleBlocks?.length,
    JSON.stringify(
      scheduleBlocks?.map(b => ({
        id: b.id,
        block_type: b.block_type,
        block_number: b.block_number,
        start_time: b.start_time
      })) || []
    ),
    studentName,
    selectedDate
  ]);
}

/**
 * Helper to get day name from date string
 */
function getDayName(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00'); // avoid TZ issues
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
    'check',
    'review',
    'practice',
    'worksheet',
    'exercise',
    'question',
    'problem',
    'drill',
    'vocab',
    'vocabulary'
  ];

  return shortTaskKeywords.some(keyword => title.includes(keyword));
}