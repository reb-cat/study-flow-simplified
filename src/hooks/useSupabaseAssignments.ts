import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseAssignment {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  course_name: string | null;
  due_date: string | null;
  scheduled_date: string | null;
  scheduled_block: number | null;
  completed_at: string | null;
  time_spent: number | null;
  canvas_url: string | null;
  canvas_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch real assignment data from Supabase assignments table
 */
export function useSupabaseAssignments(userId?: string) {
  const [assignments, setAssignments] = useState<SupabaseAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async (targetUserId?: string) => {
    if (!targetUserId) {
      console.log('❌ fetchAssignments called with no targetUserId');
      return;
    }

    console.log('🔍 Fetching assignments for user:', targetUserId);
    setIsLoading(true);
    setError(null);

    // First, get ALL assignments to see what's in the DB
    const { data: allData, error: allError } = await supabase
      .from('assignments')
      .select('*');
    
    console.log('📊 ALL assignments in DB:', allData?.length || 0, allData);

    const { data, error: fetchError } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    console.log('🎯 Filtered assignments for user', targetUserId + ':', data?.length || 0, data);
    console.log('❌ Fetch error:', fetchError);

    setIsLoading(false);

    if (fetchError) {
      console.error('Failed to fetch assignments:', fetchError);
      setError(fetchError.message);
      return;
    }

    setAssignments(data || []);
  };

  const updateAssignment = async (id: string, updates: Partial<SupabaseAssignment>) => {
    const { error: updateError } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update assignment:', updateError);
      setError(updateError.message);
      return;
    }

    // Refresh assignments after update
    if (userId) {
      fetchAssignments(userId);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAssignments(userId);
    }
  }, [userId]);

  return {
    assignments,
    isLoading,
    error,
    fetchAssignments,
    updateAssignment,
    refetch: () => fetchAssignments(userId)
  };
}