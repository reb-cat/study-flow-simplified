// Family detection utilities for assignments
export type FamilyType = "Analytical" | "Humanities" | "Composition" | "Creative";

export const COURSE_FAMILY_MAP: Record<string, FamilyType> = {
  "algebra": "Analytical",
  "geometry": "Analytical", 
  "math": "Analytical",
  "science": "Analytical",
  "earth science": "Analytical",
  "forensics": "Analytical",
  "english": "Composition",
  "grammar": "Composition",
  "composition": "Composition", 
  "english fundamentals": "Composition",
  "history": "Humanities",
  "literature": "Humanities",
  "american history": "Humanities",
  "american literature": "Humanities",
  "health": "Humanities",
  "art": "Creative",
  "photography": "Creative",
  "baking": "Creative",
};

export const FAMILY_PATTERNS: Record<string, Record<string, Record<number, FamilyType>>> = {
  "Abigail": {
    "Monday": { 2: "Analytical", 3: "Humanities", 6: "Composition" },
    "Tuesday": { 2: "Analytical", 3: "Humanities", 5: "Composition", 6: "Creative", 7: "Analytical" },
    "Wednesday": { 2: "Analytical", 3: "Humanities", 5: "Composition", 6: "Creative", 7: "Analytical" },
    "Thursday": {}, // Study Hall during co-op
    "Friday": { 2: "Analytical", 3: "Humanities", 5: "Composition", 6: "Creative", 7: "Analytical", 8: "Humanities", 9: "Composition" }
  },
  "Khalil": {
    "Monday": { 2: "Analytical", 3: "Humanities", 6: "Composition" },
    "Tuesday": { 2: "Analytical", 3: "Humanities", 5: "Composition", 6: "Creative", 7: "Analytical" },
    "Wednesday": { 2: "Analytical", 3: "Humanities", 5: "Composition", 6: "Creative", 7: "Analytical" },
    "Thursday": {}, // Study Hall during co-op  
    "Friday": { 2: "Analytical", 3: "Humanities", 5: "Composition", 6: "Creative", 7: "Analytical" }
  }
};

export function detectFamily(assignment: { title: string; subject?: string }): FamilyType {
  const title = (assignment.title || '').toLowerCase();
  const course = (assignment.subject || '').toLowerCase();
  
  // Keywords override course defaults
  if (title.match(/create|sketch|draw|map|diagram|poster|slides/)) return "Creative";
  if (title.match(/essay|write|draft|response|dbq|outline/)) return "Composition";
  if (title.match(/read|chapter|pages/) && course.includes('history')) return "Humanities";
  
  // Course defaults - check for partial matches
  for (const [courseKey, family] of Object.entries(COURSE_FAMILY_MAP)) {
    if (course.includes(courseKey)) {
      return family;
    }
  }
  
  return "Analytical"; // default
}

export function getBlockFamily(student: string, dayName: string, blockNumber: number): FamilyType | null {
  return FAMILY_PATTERNS[student]?.[dayName]?.[blockNumber] || null;
}

export function addFamilyToAssignment<T extends { title: string; subject?: string }>(assignment: T): T & { detectedFamily: FamilyType } {
  return {
    ...assignment,
    detectedFamily: detectFamily(assignment)
  };
}

// Check if assignment should be split (History modules)
export function shouldSplitAssignment(assignment: { title: string; subject?: string }): boolean {
  const title = assignment.title || '';
  const course = (assignment.subject || '').toLowerCase();
  
  return title.includes("Module") && course.includes("history");
}

// Check if assignment needs special resources (for Study Hall filtering)
export function requiresSpecialResources(assignment: { title: string }): boolean {
  const title = assignment.title.toLowerCase();
  return title.match(/lab|experiment|presentation|project|group/) !== null;
}