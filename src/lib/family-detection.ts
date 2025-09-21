import { COURSE_FAMILY_MAP, type Family } from './scheduling-constants';

export interface Assignment {
  id: string;
  title: string;
  course_name?: string;
  subject?: string;
  due_date?: string;
  scheduled_date?: string;
  scheduled_block?: number;
  detected_family?: string;
  actual_estimated_minutes?: number;
  completion_status?: string;
  time_spent?: number;
  parent_id?: string;
}

// Keyword-based family detection with course override
export function detectFamily(assignment: Assignment): Family {
  const title = assignment.title.toLowerCase();
  
  // Creative keywords override course default
  if (title.match(/create|sketch|draw|map|diagram|poster|slides|build|design|art|paint|photo/)) {
    return "Creative";
  }
  
  // Composition keywords override course default
  if (title.match(/essay|write|draft|response|dbq|outline|paragraph|compose|letter|report/)) {
    return "Composition";
  }
  
  // Reading assignments in any course → Humanities
  if (title.match(/read|chapter|pages|book|novel|story|literature|poem/)) {
    return "Humanities";
  }
  
  // Analytical keywords
  if (title.match(/solve|calculate|problem|quiz|test|exam|formula|equation|lab|experiment/)) {
    return "Analytical";
  }
  
  // Default to course mapping
  const courseName = assignment.course_name || assignment.subject || "";
  return (COURSE_FAMILY_MAP[courseName] || "Analytical") as Family;
}

// Split multi-day history modules into daily assignments
export function splitHistoryModule(assignment: Assignment): Assignment[] {
  if (!assignment.title.includes("Module") || 
      !(assignment.course_name?.includes("History") || assignment.subject?.includes("History"))) {
    return [assignment];
  }

  const assignments: Assignment[] = [];
  for (let day = 1; day <= 5; day++) {
    assignments.push({
      ...assignment,
      id: `${assignment.id}-day${day}`,
      title: `${assignment.title} - Day ${day}`,
      parent_id: assignment.id,
      actual_estimated_minutes: Math.floor((assignment.actual_estimated_minutes || 30) / 5)
    });
  }
  
  return assignments;
}

// Check if assignment needs special resources (not good for Study Hall)
export function requiresSpecialResources(assignment: Assignment): boolean {
  const title = assignment.title.toLowerCase();
  return title.match(/video|online|computer|internet|canvas|zoom|lab|experiment|presentation/) !== null;
}