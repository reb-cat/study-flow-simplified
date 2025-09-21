import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DemoAssignmentData {
  id: string;
  student_name: string;
  title: string;
  subject: string | null;
  course_name: string | null;
  due_date: string | null;
  scheduled_date: string | null;
  scheduled_block: number | null;
  completed_at: string | null;
  time_spent: number | null;
  priority: string;
  difficulty: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch demo assignment data from the separate demo_assignments table
 */
export function useDemoAssignments(studentName?: string) {
  const [assignments, setAssignments] = useState<DemoAssignmentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDemoAssignments = async (targetStudentName?: string) => {
    if (!targetStudentName) {
      console.log('❌ Demo: fetchDemoAssignments called with no targetStudentName');
      return;
    }

    console.log('🎭 Demo: Fetching assignments for student:', targetStudentName);
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('demo_assignments')
      .select('*')
      .eq('student_name', targetStudentName)
      .order('created_at', { ascending: false });

    console.log('🎭 Demo: assignments fetched:', data?.length || 0, data);
    console.log('❌ Demo: fetch error:', fetchError);

    setIsLoading(false);

    if (fetchError) {
      console.error('Failed to fetch demo assignments:', fetchError);
      setError(fetchError.message);
      return;
    }

    setAssignments(data || []);
  };

  useEffect(() => {
    if (studentName) {
      fetchDemoAssignments(studentName);
    }
  }, [studentName]);

  return {
    assignments,
    isLoading,
    error,
    refetch: () => fetchDemoAssignments(studentName)
  };
}