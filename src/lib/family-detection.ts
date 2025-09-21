// Charlotte Mason Family Pattern System
// Each assignment gets classified into a family for variety

export type AssignmentFamily = 'Analytical' | 'Humanities' | 'Composition' | 'Creative';

// Fallback activities for when no assignment is available
export const FALLBACKS: Record<AssignmentFamily, string[]> = {
  Creative: ['Map Sketch', 'Science Diagram', 'Narration Art'],
  Analytical: ['Review problems'],
  Humanities: ['Free reading'],
  Composition: ['Journal entry']
};

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
export function detectFamily(assignment: { title?: string; subject?: string | null; course_name?: string | null }): AssignmentFamily {
  const title = (assignment.title || '').toLowerCase();
  const course = (assignment.course_name || assignment.subject || '').toLowerCase();
  
  console.log('🔍 detectFamily - Assignment:', assignment.title, 'Course:', assignment.course_name, 'Subject:', assignment.subject);
  console.log('🔍 detectFamily - Processing title:', title, 'course:', course);
  
  // Keywords override course defaults
  if (title.includes('create') || title.includes('sketch') || title.includes('map') || 
      title.includes('diagram') || title.includes('poster') || title.includes('draw')) {
    console.log('🎯 detectFamily - Detected Creative for:', assignment.title);
    return "Creative";
  }
  
  if (title.includes('essay') || title.includes('write') || title.includes('draft') || 
      title.includes('response') || title.includes('dbq')) {
    console.log('🎯 detectFamily - Detected Composition for:', assignment.title);
    return "Composition";
  }
  
  if (title.includes('read') || title.includes('chapter') || title.includes('pages')) {
    if (course.includes('history')) {
      console.log('🎯 detectFamily - Detected Humanities (reading history) for:', assignment.title);
      return "Humanities";
    }
  }
  
  // Course defaults
  if (course.includes('algebra') || course.includes('geometry') || course.includes('math') || 
      course.includes('science') || course.includes('chemistry') || course.includes('physics')) {
    console.log('🎯 detectFamily - Detected Analytical (math/science) for:', assignment.title);
    return "Analytical";
  }
  
  if (course.includes('history') || course.includes('literature') || course.includes('social')) {
    console.log('🎯 detectFamily - Detected Humanities (history/lit) for:', assignment.title);
    return "Humanities";
  }
  
  if (course.includes('english') || course.includes('grammar') || course.includes('writing')) {
    console.log('🎯 detectFamily - Detected Composition (english/grammar) for:', assignment.title);
    return "Composition";
  }
  
  if (course.includes('art') || course.includes('photo') || course.includes('music') || 
      course.includes('baking') || course.includes('creative')) {
    console.log('🎯 detectFamily - Detected Creative (art/photo) for:', assignment.title);
    return "Creative";
  }
  
  console.log('🎯 detectFamily - Default Analytical for:', assignment.title);
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
 * Check if assignment requires special resources (lab, kitchen, camera, etc.)
 */
export function requiresSpecialResources(assignment: { title?: string; subject?: string | null; course_name?: string | null }): boolean {
  const title = (assignment.title || '').toLowerCase();
  const course = (assignment.course_name || assignment.subject || '').toLowerCase();
  
  // Resource keywords that suggest special equipment/location needed
  const resourceKeywords = [
    'lab', 'laboratory', 'experiment', 'kitchen', 'baking', 'cooking',
    'camera', 'photo', 'video', 'record', 'film', 'studio',
    'interview', 'presentation', 'group project', 'field trip',
    'microscope', 'dissect', 'chemicals'
  ];
  
  return resourceKeywords.some(keyword => 
    title.includes(keyword) || course.includes(keyword)
  );
}

/**
 * Estimate assignment duration in minutes based on title and difficulty
 */
export function estimateAssignmentMinutes(assignment: { title?: string; difficulty?: string; subject?: string | null }): number {
  const title = (assignment.title || '').toLowerCase();
  const difficulty = (assignment.difficulty || '').toLowerCase();
  const subject = (assignment.subject || '').toLowerCase();
  
  // Quick tasks (5-15 minutes)
  if (title.includes('quiz') || title.includes('vocabulary') || title.includes('drill')) {
    return 10;
  }
  
  // Short tasks (15-25 minutes)
  if (title.includes('worksheet') || title.includes('practice') || title.includes('review') || title.includes('check')) {
    return 20;
  }
  
  // Reading tasks vary by difficulty
  if (title.includes('read') || title.includes('chapter') || title.includes('pages')) {
    if (difficulty === 'easy') return 20;
    if (difficulty === 'hard') return 45;
    return 30; // medium default
  }
  
  // Math problems
  if (subject.includes('math') || subject.includes('algebra') || subject.includes('geometry')) {
    if (title.includes('problem set') || title.includes('worksheet')) {
      return difficulty === 'hard' ? 35 : 25;
    }
  }
  
  // Writing tasks (typically longer)
  if (title.includes('essay') || title.includes('write') || title.includes('draft')) {
    return 60; // Too long for Study Hall
  }
  
  // Default based on difficulty
  if (difficulty === 'easy') return 20;
  if (difficulty === 'hard') return 45;
  return 30; // medium default
}

/**
 * Get Study Hall priority score (lower = higher priority)
 */
export function getStudyHallPriority(assignment: { title?: string; subject?: string | null; course_name?: string | null }): number {
  const title = (assignment.title || '').toLowerCase();
  const course = (assignment.course_name || assignment.subject || '').toLowerCase();
  
  // Priority 1: Reading tasks
  if (title.includes('read') || title.includes('chapter') || title.includes('pages')) {
    return 1;
  }
  
  // Priority 2: Short problem sets and worksheets
  if (title.includes('worksheet') || title.includes('practice') || title.includes('problem set') || title.includes('drill')) {
    return 2;
  }
  
  // Priority 3: Review and catch-up tasks
  if (title.includes('review') || title.includes('quiz') || title.includes('check') || title.includes('vocabulary')) {
    return 3;
  }
  
  return 4; // Other tasks (lowest priority)
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