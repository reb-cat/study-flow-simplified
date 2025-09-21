export interface DemoAssignment {
  student_name: string;
  title: string;
  course_name: string;
  subject: string;
  due_date: string;
  priority: string;
  difficulty: string;
}

// Insert demo data into separate demo_assignments table
export const insertDemoAssignments = async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Check if demo data already exists
  const { data: existing } = await supabase
    .from('demo_assignments')
    .select('id')
    .limit(1);
  
  if (existing && existing.length > 0) {
    return; // Demo data already exists
  }

  // Insert all demo assignments
  const { error } = await supabase
    .from('demo_assignments')
    .insert(DEMO_ASSIGNMENTS);
    
  if (error) {
    console.error('Error inserting demo assignments:', error);
  }
};

export const DEMO_ASSIGNMENTS: DemoAssignment[] = [
  // ABIGAIL'S ASSIGNMENTS (25+ assignments)
  // Geometry (Analytical)
  { student_name: 'demo-abigail', title: 'Geometry Problem Set 5', course_name: 'Geometry', subject: 'Math', due_date: '2025-09-23', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Triangle Proofs Practice', course_name: 'Geometry', subject: 'Math', due_date: '2025-09-24', priority: 'B', difficulty: 'hard' },
  { student_name: 'demo-abigail', title: 'Chapter 6 Review Problems', course_name: 'Geometry', subject: 'Math', due_date: '2025-09-25', priority: 'B', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Angle Relationships Worksheet', course_name: 'Geometry', subject: 'Math', due_date: '2025-09-26', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Quiz Corrections', course_name: 'Geometry', subject: 'Math', due_date: '2025-09-27', priority: 'C', difficulty: 'easy' },

  // American Literature (Humanities/Composition)
  { student_name: 'demo-abigail', title: 'Read Chapters 8-9', course_name: 'American Literature', subject: 'English', due_date: '2025-09-22', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Character Analysis Notes', course_name: 'American Literature', subject: 'English', due_date: '2025-09-23', priority: 'B', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Essay Draft - Symbolism', course_name: 'American Literature', subject: 'English', due_date: '2025-09-24', priority: 'A', difficulty: 'hard' },
  { student_name: 'demo-abigail', title: 'Read Poetry Section', course_name: 'American Literature', subject: 'English', due_date: '2025-09-25', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Discussion Board Post', course_name: 'American Literature', subject: 'English', due_date: '2025-09-26', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Vocabulary Review', course_name: 'American Literature', subject: 'English', due_date: '2025-09-27', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Essay Revision', course_name: 'American Literature', subject: 'English', due_date: '2025-09-28', priority: 'A', difficulty: 'medium' },

  // Forensics (Analytical)
  { student_name: 'demo-abigail', title: 'Case Study Analysis', course_name: 'Forensics', subject: 'Science', due_date: '2025-09-23', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Lab Report - Fingerprints', course_name: 'Forensics', subject: 'Science', due_date: '2025-09-25', priority: 'A', difficulty: 'hard' },
  { student_name: 'demo-abigail', title: 'Read Chapter 10', course_name: 'Forensics', subject: 'Science', due_date: '2025-09-26', priority: 'B', difficulty: 'medium' },

  // Science (Analytical)
  { student_name: 'demo-abigail', title: 'Biology Lab Report', course_name: 'Science', subject: 'Science', due_date: '2025-09-22', priority: 'A', difficulty: 'hard' },
  { student_name: 'demo-abigail', title: 'Cell Division Worksheet', course_name: 'Science', subject: 'Science', due_date: '2025-09-24', priority: 'B', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Read Chapter 12', course_name: 'Science', subject: 'Science', due_date: '2025-09-25', priority: 'B', difficulty: 'easy' },
  
  // Creative Assignments
  { student_name: 'demo-abigail', title: 'Photography Project - Lighting', course_name: 'Photography', subject: 'Art', due_date: '2025-09-24', priority: 'B', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Edit Photo Series', course_name: 'Photography', subject: 'Art', due_date: '2025-09-26', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Create Timeline Poster', course_name: 'History', subject: 'History', due_date: '2025-09-25', priority: 'B', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Draw Cell Diagram', course_name: 'Science', subject: 'Science', due_date: '2025-09-23', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Sketch Historical Map', course_name: 'History', subject: 'History', due_date: '2025-09-27', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Design Book Cover', course_name: 'American Literature', subject: 'English', due_date: '2025-09-28', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Baking Recipe Card', course_name: 'Baking', subject: 'Elective', due_date: '2025-09-26', priority: 'C', difficulty: 'easy' },

  // KHALIL'S ASSIGNMENTS (25+ assignments)
  // Algebra (Analytical)
  { student_name: 'demo-khalil', title: 'Algebra Worksheet 12', course_name: 'Algebra 1', subject: 'Math', due_date: '2025-09-22', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-khalil', title: 'Practice Problems 5.1', course_name: 'Algebra 1', subject: 'Math', due_date: '2025-09-23', priority: 'B', difficulty: 'medium' },
  { student_name: 'demo-khalil', title: 'Quiz Review Sheet', course_name: 'Algebra 1', subject: 'Math', due_date: '2025-09-24', priority: 'A', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Problem Set 8', course_name: 'Algebra 1', subject: 'Math', due_date: '2025-09-25', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-khalil', title: 'Online Practice Assignment', course_name: 'Algebra 1', subject: 'Math', due_date: '2025-09-26', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Chapter 5 Test Prep', course_name: 'Algebra 1', subject: 'Math', due_date: '2025-09-27', priority: 'A', difficulty: 'medium' },

  // American History (Humanities)
  { student_name: 'demo-khalil', title: 'Module 5 - Day 1', course_name: 'American History', subject: 'History', due_date: '2025-09-22', priority: 'A', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Module 5 - Day 2', course_name: 'American History', subject: 'History', due_date: '2025-09-23', priority: 'A', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Module 5 - Day 3', course_name: 'American History', subject: 'History', due_date: '2025-09-24', priority: 'A', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Module 5 - Day 4', course_name: 'American History', subject: 'History', due_date: '2025-09-25', priority: 'A', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Module 5 - Day 5', course_name: 'American History', subject: 'History', due_date: '2025-09-26', priority: 'A', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Timeline Activity', course_name: 'American History', subject: 'History', due_date: '2025-09-27', priority: 'B', difficulty: 'medium' },

  // English Fundamentals (Composition)
  { student_name: 'demo-khalil', title: 'Grammar Exercises Ch 8', course_name: 'English Fundamentals', subject: 'English', due_date: '2025-09-22', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Write Descriptive Paragraph', course_name: 'English Fundamentals', subject: 'English', due_date: '2025-09-23', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-khalil', title: 'Vocabulary Practice', course_name: 'English Fundamentals', subject: 'English', due_date: '2025-09-24', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Essay Outline', course_name: 'English Fundamentals', subject: 'English', due_date: '2025-09-25', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-khalil', title: 'Peer Review Assignment', course_name: 'English Fundamentals', subject: 'English', due_date: '2025-09-26', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Final Essay Draft', course_name: 'English Fundamentals', subject: 'English', due_date: '2025-09-28', priority: 'A', difficulty: 'hard' },

  // Earth Science (Analytical)
  { student_name: 'demo-khalil', title: 'Rock Cycle Worksheet', course_name: 'Earth Science', subject: 'Science', due_date: '2025-09-22', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Lab Report - Minerals', course_name: 'Earth Science', subject: 'Science', due_date: '2025-09-24', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-khalil', title: 'Read Chapter 7', course_name: 'Earth Science', subject: 'Science', due_date: '2025-09-23', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Volcano Research', course_name: 'Earth Science', subject: 'Science', due_date: '2025-09-26', priority: 'B', difficulty: 'medium' },

  // Health
  { student_name: 'demo-khalil', title: 'Health Module 3 Reading', course_name: 'Health', subject: 'Health', due_date: '2025-09-23', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Nutrition Worksheet', course_name: 'Health', subject: 'Health', due_date: '2025-09-25', priority: 'B', difficulty: 'easy' },
  
  // Art (Creative)
  { student_name: 'demo-khalil', title: 'Color Wheel Project', course_name: 'Art', subject: 'Art', due_date: '2025-09-23', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Sketch Assignment - Still Life', course_name: 'Art', subject: 'Art', due_date: '2025-09-25', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Art History Reading', course_name: 'Art', subject: 'Art', due_date: '2025-09-26', priority: 'B', difficulty: 'easy' },

  // Language Fundamentals
  { student_name: 'demo-khalil', title: 'LF Worksheet - Verbs', course_name: 'Language Fundamentals', subject: 'English', due_date: '2025-09-24', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Sentence Structure Practice', course_name: 'Language Fundamentals', subject: 'English', due_date: '2025-09-26', priority: 'B', difficulty: 'easy' }
];