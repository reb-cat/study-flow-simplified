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
  // Abigail's assignments
  { student_name: 'demo-abigail', title: 'Geometry Problem Set 5', course_name: 'Geometry', subject: 'Math', due_date: '2024-09-17', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Read Chapters 8-9', course_name: 'American Literature', subject: 'English', due_date: '2024-09-18', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Essay Draft - Symbolism', course_name: 'English Composition', subject: 'English', due_date: '2024-09-19', priority: 'A', difficulty: 'hard' },
  { student_name: 'demo-abigail', title: 'Forensics Case Study', course_name: 'Forensics', subject: 'Science', due_date: '2024-09-20', priority: 'B', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Create Timeline Poster', course_name: 'History', subject: 'History', due_date: '2024-09-21', priority: 'B', difficulty: 'medium' },
  { student_name: 'demo-abigail', title: 'Photography Project', course_name: 'Photography', subject: 'Art', due_date: '2024-09-22', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-abigail', title: 'Science Lab Report', course_name: 'Science', subject: 'Science', due_date: '2024-09-20', priority: 'A', difficulty: 'hard' },
  
  // Khalil's assignments
  { student_name: 'demo-khalil', title: 'Algebra Worksheet 12', course_name: 'Algebra 1', subject: 'Math', due_date: '2024-09-17', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-khalil', title: 'Read Module 5', course_name: 'American History', subject: 'History', due_date: '2024-09-18', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Grammar Exercises', course_name: 'English Fundamentals', subject: 'English', due_date: '2024-09-19', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Earth Science Lab', course_name: 'Earth Science', subject: 'Science', due_date: '2024-09-20', priority: 'A', difficulty: 'medium' },
  { student_name: 'demo-khalil', title: 'Health Module Quiz', course_name: 'Health', subject: 'Health', due_date: '2024-09-21', priority: 'B', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Art Sketch Assignment', course_name: 'Art', subject: 'Art', due_date: '2024-09-22', priority: 'C', difficulty: 'easy' },
  { student_name: 'demo-khalil', title: 'Write Essay Outline', course_name: 'English Fundamentals', subject: 'English', due_date: '2024-09-23', priority: 'B', difficulty: 'medium' }
];