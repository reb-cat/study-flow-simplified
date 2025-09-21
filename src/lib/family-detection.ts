// Charlotte Mason Family Pattern System
// Each assignment gets classified into a family for variety

export type AssignmentFamily = 'Analytical' | 'Humanities' | 'Composition' | 'Creative';

// Block family assignments for each student and day
export const BLOCK_FAMILIES: Record<string, Record<string, Record<number, AssignmentFamily>>> = {
  "Abigail": {
    "Monday": {
      2: "Analytical",    // Block 2 (9:20-9:50)
      3: "Humanities",    // Block 3 (9:50-10:20) 
      6: "Composition"    // Block 6 (14:30-15:00)
    },
    "Tuesday": {
      2: "Analytical",
      3: "Humanities", 
      5: "Composition",
      6: "Creative",
      7: "Analytical"
    },
    "Wednesday": {
      2: "Analytical",
      5: "Humanities", 
      6: "Composition",
      7: "Creative",
      8: "Analytical"
    },
    "Friday": {
      2: "Analytical",
      3: "Humanities",
      4: "Composition", 
      5: "Creative",
      6: "Analytical",
      7: "Humanities",
      8: "Composition"
    }
  },
  "Khalil": {
    "Monday": {
      2: "Humanities",
      3: "Analytical",
      6: "Composition"
    },
    "Tuesday": {
      2: "Humanities",
      3: "Analytical",
      5: "Composition",
      6: "Creative", 
      7: "Analytical"
    },
    "Wednesday": {
      2: "Analytical", // Algebra priority
      3: "Analytical", // Algebra priority
      5: "Humanities",
      6: "Composition",
      7: "Creative"
    },
    "Friday": {
      2: "Analytical",
      3: "Humanities",
      4: "Composition",
      5: "Creative",
      6: "Analytical"
    }
  }
};

/**
 * Detect the family classification of an assignment
 */
export function detectFamily(assignment: { title?: string; subject?: string; canvasUrl?: string }): AssignmentFamily {
  const title = (assignment.title || '').toLowerCase();
  const course = (assignment.subject || '').toLowerCase();
  
  // Keywords override course defaults
  if (title.includes('create') || title.includes('sketch') || title.includes('map') || 
      title.includes('diagram') || title.includes('poster') || title.includes('draw')) {
    return "Creative";
  }
  
  if (title.includes('essay') || title.includes('write') || title.includes('draft') || 
      title.includes('response') || title.includes('dbq')) {
    return "Composition";
  }
  
  if (title.includes('read') || title.includes('chapter') || title.includes('pages')) {
    if (course.includes('history')) return "Humanities";
  }
  
  // Course defaults
  if (course.includes('algebra') || course.includes('geometry') || course.includes('math') || 
      course.includes('science') || course.includes('chemistry') || course.includes('physics')) {
    return "Analytical";
  }
  
  if (course.includes('history') || course.includes('literature') || course.includes('social')) {
    return "Humanities";
  }
  
  if (course.includes('english') || course.includes('grammar') || course.includes('writing')) {
    return "Composition";
  }
  
  if (course.includes('art') || course.includes('photo') || course.includes('music') || 
      course.includes('baking') || course.includes('creative')) {
    return "Creative";
  }
  
  return "Analytical"; // default fallback
}

/**
 * Get the family designation for a specific block
 */
export function getBlockFamily(studentName: string, dayName: string, blockNumber: number): AssignmentFamily | null {
  return BLOCK_FAMILIES[studentName]?.[dayName]?.[blockNumber] || null;
}

/**
 * Check if this is a Study Hall block during co-op time
 */
export function isStudyHallBlock(blockType?: string, startTime?: string): boolean {
  const blockTypeLower = (blockType || '').toLowerCase();
  
  // Study Hall blocks during co-op time (typically afternoon)
  if (blockTypeLower === 'study hall') {
    return true;
  }
  
  // Additional logic for co-op time detection if needed
  if (startTime) {
    const [hour] = startTime.split(':').map(Number);
    // Afternoon blocks during typical co-op time
    return hour >= 13 && blockTypeLower.includes('study');
  }
  
  return false;
}

/**
 * Special rules for Khalil's Algebra priority
 */
export function shouldPrioritizeAlgebra(studentName: string, dayName: string, blockNumber: number): boolean {
  if (studentName !== "Khalil") return false;
  
  // Monday/Wednesday morning blocks (before 15:30)
  if ((dayName === "Monday" || dayName === "Wednesday") && blockNumber <= 3) {
    return true;
  }
  
  return false;
}