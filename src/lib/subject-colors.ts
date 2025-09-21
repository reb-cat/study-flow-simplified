// Activity-based color mapping for schedule blocks
import { AssignmentFamily } from './family-detection';

export type ActivityColorClass = 
  | 'activity-travel' 
  | 'activity-coop' 
  | 'activity-assignments' 
  | 'activity-online'
  | '';

/**
 * Maps schedule blocks to activity-based color classes for visual organization
 */
export function getSubjectColorClass(subject?: string, blockName?: string): ActivityColorClass {
  if (!subject && !blockName) return '';
  
  const content = `${subject || ''} ${blockName || ''}`.toLowerCase();
  
  // Travel & Prep (Color/Shade 1)
  if (content.includes('travel') || content.includes('prep') || content.includes('drive') || content.includes('commute')) {
    return 'activity-travel';
  }
  
  // Co-op time blocks (Color/Shade 2)  
  if (content.includes('co-op') || content.includes('coop') || content.includes('group') || content.includes('class time') || content.includes('lunch')) {
    return 'activity-coop';
  }
  
  // Online Class (Color/Shade 4)
  if (content.includes('online') || content.includes('zoom') || content.includes('virtual') || content.includes('webinar')) {
    return 'activity-online';
  }
  
  // Assignments + Bible (Color/Shade 3) - catch-all for at-home activities
  if (content.includes('assignment') || content.includes('bible') || content.includes('study') || 
      content.includes('homework') || content.includes('reading') || content.includes('writing') ||
      content.includes('math') || content.includes('literature') || content.includes('geometry') ||
      content.includes('history') || content.includes('science') || content.includes('english')) {
    return 'activity-assignments';
  }
  
  return '';
}

/**
 * Get an activity-specific background color for better visual organization
 */
export function getSubjectBackground(subject?: string): string {
  const activityClass = getSubjectColorClass(subject);
  
  switch (activityClass) {
    case 'activity-travel':
      return 'bg-travel-light';
    case 'activity-coop':
      return 'bg-coop-light';
    case 'activity-assignments':
      return 'bg-assignments-light';
    case 'activity-online':
      return 'bg-online-light';
    default:
      return 'bg-card';
  }
}