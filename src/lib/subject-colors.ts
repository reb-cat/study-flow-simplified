// EF-friendly subject color mapping
import { AssignmentFamily } from './family-detection';

export type SubjectColorClass = 
  | 'location-travel' 
  | 'location-coop' 
  | 'location-online' 
  | 'location-home'
  | '';

/**
 * Maps subjects to location-based color classes for visual organization
 */
export function getSubjectColorClass(family?: AssignmentFamily | string): SubjectColorClass {
  if (!family) return '';
  
  const familyLower = family.toLowerCase();
  
  // Travel activities
  if (familyLower.includes('travel') || familyLower.includes('field trip') || familyLower.includes('outing')) {
    return 'location-travel';
  }
  
  // Co-op activities (ALL fixed blocks including Study Hall, Lunch, etc.)
  if (familyLower.includes('co-op') || familyLower.includes('coop') || familyLower.includes('cooperative') ||
      familyLower.includes('study hall') || familyLower.includes('lunch') || familyLower.includes('break') ||
      familyLower.includes('recess') || familyLower.includes('movement') || familyLower.includes('snack')) {
    return 'location-coop';
  }
  
  // Online activities (Zoom classes)
  if (familyLower.includes('online') || familyLower.includes('zoom') || familyLower.includes('virtual') || familyLower.includes('video')) {
    return 'location-online';
  }
  
  // At-home activities (assignments, Bible, etc.)
  if (familyLower.includes('assignment') || familyLower.includes('bible') || familyLower.includes('devotion') || 
      familyLower.includes('homework') || familyLower.includes('reading')) {
    return 'location-home';
  }
  
  // Default based on subject type for remaining items
  if (familyLower.includes('math') || familyLower.includes('geometry') || familyLower.includes('algebra')) {
    return 'location-home';
  }
  
  if (familyLower.includes('literature') || familyLower.includes('english') || familyLower.includes('writing')) {
    return 'location-home';
  }
  
  return '';
}

/**
 * Get a subject-specific background color for better visual organization
 */
export function getSubjectBackground(subject?: string): string {
  if (!subject) return 'bg-card';
  
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('math') || subjectLower.includes('algebra')) {
    return 'bg-math-family-light';
  }
  
  if (subjectLower.includes('english') || subjectLower.includes('language')) {
    return 'bg-language-family-light';
  }
  
  if (subjectLower.includes('science') || subjectLower.includes('biology')) {
    return 'bg-science-family-light';
  }
  
  if (subjectLower.includes('history') || subjectLower.includes('social')) {
    return 'bg-history-family-light';
  }
  
  if (subjectLower.includes('art') || subjectLower.includes('music')) {
    return 'bg-arts-family-light';
  }
  
  return 'bg-card';
}