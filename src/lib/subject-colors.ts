// Activity-based color mapping for schedule blocks
import { AssignmentFamily } from './family-detection';

export type SubjectColorClass = 
  | 'subject-blue'     // Travel & Prep
  | 'subject-purple'   // Co-op blocks
  | 'subject-green'    // Assignments & Bible
  | 'subject-orange'   // Online classes & special subjects
  | 'subject-yellow'   // Movement & breaks
  | '';

/**
 * Maps block types and subjects to activity-based color classes
 * Blue: Prep/Load
 * Purple: Co-op, Lunch  
 * Green: Assignment, Bible
 * Orange: Forensics, Tutoring, Algebra, Language Fundamentals
 * Yellow: Movement & breaks
 */
export function getSubjectColorClass(blockType?: string, subject?: string): SubjectColorClass {
  const blockTypeLower = blockType?.toLowerCase() || '';
  const subjectLower = subject?.toLowerCase() || '';
  
  // Orange: Special subjects that need attention (override block_type)
  if (subjectLower.includes('forensics') || 
      subjectLower.includes('tutoring') || 
      subjectLower.includes('algebra') ||
      subjectLower.includes('language fundamentals')) {
    return 'subject-orange';
  }
  
  // Yellow: Movement & break blocks - energetic "get up and move!" color
  if (subjectLower.includes('movement')) {
    return 'subject-yellow';
  }
  
  // Blue: Travel & Prep blocks
  if (blockTypeLower.includes('prep') || blockTypeLower.includes('load')) {
    return 'subject-blue';
  }
  
  // Purple: Co-op time blocks
  if (blockTypeLower.includes('co-op') || blockTypeLower.includes('lunch')) {
    return 'subject-purple';
  }
  
  // Green: Assignment and Bible blocks
  if (blockTypeLower.includes('assignment') || subjectLower.includes('bible')) {
    return 'subject-green';
  }
  
  return '';
}

/**
 * Legacy function for backward compatibility - uses subject only
 */
export function getSubjectBackground(subject?: string): string {
  if (!subject) return 'bg-card';
  
  const colorClass = getSubjectColorClass('', subject);
  
  switch (colorClass) {
    case 'subject-blue':
      return 'bg-blue-family-light';
    case 'subject-purple':
      return 'bg-purple-family-light';
    case 'subject-green':
      return 'bg-green-family-light';
    case 'subject-orange':
      return 'bg-orange-family-light';
    case 'subject-yellow':
      return 'bg-yellow-family-light';
    default:
      return 'bg-card';
  }
}