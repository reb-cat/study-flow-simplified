// EF-friendly subject color mapping
import { AssignmentFamily } from './family-detection';

export type SubjectColorClass = 
  | 'subject-math' 
  | 'subject-language' 
  | 'subject-science' 
  | 'subject-history' 
  | 'subject-arts' 
  | 'subject-practical'
  | '';

/**
 * Maps assignment families to EF-friendly color classes for visual organization
 */
export function getSubjectColorClass(family?: AssignmentFamily | string): SubjectColorClass {
  if (!family) return '';
  
  const familyLower = family.toLowerCase();
  
  if (familyLower.includes('math') || familyLower.includes('algebra') || familyLower.includes('geometry')) {
    return 'subject-math';
  }
  
  if (familyLower.includes('language') || familyLower.includes('english') || familyLower.includes('writing')) {
    return 'subject-language';
  }
  
  if (familyLower.includes('science') || familyLower.includes('biology') || familyLower.includes('chemistry') || familyLower.includes('physics')) {
    return 'subject-science';
  }
  
  if (familyLower.includes('history') || familyLower.includes('social') || familyLower.includes('geography')) {
    return 'subject-history';
  }
  
  if (familyLower.includes('arts') || familyLower.includes('art') || familyLower.includes('music') || familyLower.includes('drama')) {
    return 'subject-arts';
  }
  
  if (familyLower.includes('practical') || familyLower.includes('pe') || familyLower.includes('physical') || familyLower.includes('life')) {
    return 'subject-practical';
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