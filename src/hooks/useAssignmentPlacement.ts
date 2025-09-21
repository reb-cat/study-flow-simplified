import { useCallback } from 'react';
import { Assignment, ScheduleTemplate } from '@/types';
import { getBlockFamily, addFamilyToAssignment, FamilyType } from '@/lib/family-detection';

interface AssignmentWithFamily extends Assignment {
  detectedFamily: FamilyType;
}

export const useAssignmentPlacement = () => {
  
  const populateAssignmentBlocks = useCallback((
    assignments: Assignment[],
    daySchedule: ScheduleTemplate[],
    student: string,
    dayName: string
  ): (ScheduleTemplate & { assignment?: AssignmentWithFamily })[] => {
    
    // Add family detection to all assignments
    const assignmentsWithFamily = assignments.map(addFamilyToAssignment);
    const unscheduledAssignments = assignmentsWithFamily.filter(a => !a.scheduledDate || !a.scheduledBlock);
    
    // Track which assignments have been scheduled
    const scheduledAssignmentIds = new Set<string>();
    
    return daySchedule.map(block => {
      // Only populate Assignment blocks (co-op blocks handle Study Hall separately)
      if (block.blockType !== 'assignment') {
        return block;
      }
      
      const blockFamily = getBlockFamily(student, dayName, block.blockNumber);
      
      // Handle co-op blocks as Study Hall
      if (block.subject.toLowerCase().includes('study hall') || block.subject.toLowerCase().includes('co-op')) {
        // Study Hall: find short assignments that don't need special resources
        const studyHallCandidates = unscheduledAssignments
          .filter(a => !scheduledAssignmentIds.has(a.id))
          .filter(a => (a.timeSpent || 25) <= 25) // Prefer short tasks
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        if (studyHallCandidates.length > 0) {
          const assignment = studyHallCandidates[0];
          scheduledAssignmentIds.add(assignment.id);
          return { ...block, assignment };
        }
        
        return block;
      }
      
      // Regular Assignment block
      if (!blockFamily) {
        return block;
      }
      
      // Special rule: Khalil's Algebra priority on Mon/Wed morning blocks
      if (student === "Khalil" && (dayName === "Monday" || dayName === "Wednesday")) {
        if (block.blockNumber <= 3 && blockFamily === "Analytical") {
          const algebraAssignments = unscheduledAssignments
            .filter(a => !scheduledAssignmentIds.has(a.id))
            .filter(a => (a.subject || '').toLowerCase().includes('algebra'))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          
          if (algebraAssignments.length > 0) {
            const assignment = algebraAssignments[0];
            scheduledAssignmentIds.add(assignment.id);
            return { ...block, assignment };
          }
        }
      }
      
      // Find assignment matching this family
      const matchingAssignments = unscheduledAssignments
        .filter(a => !scheduledAssignmentIds.has(a.id))
        .filter(a => a.detectedFamily === blockFamily)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      if (matchingAssignments.length > 0) {
        const assignment = matchingAssignments[0];
        scheduledAssignmentIds.add(assignment.id);
        return { ...block, assignment };
      }
      
      // No matching assignment found
      return block;
    });
  }, []);
  
  return {
    populateAssignmentBlocks
  };
};