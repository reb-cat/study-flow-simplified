import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedAssignment } from '@/types/assignment';

/**
 * Unified hook that works for both demo and production assignments
 * The only difference is the table name
 */
export function useUnifiedAssignments(userId?: string, isDemo: boolean = false, refreshKey?: number) {
  const [assignments, setAssignments] = useState<UnifiedAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tableName = isDemo ? 'demo_assignments' : 'assignments';

  const fetchAssignments = async (targetUserId?: string) => {
    if (!targetUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Different column sets for different tables
      const baseColumns = 'id, user_id, title, course_name, subject, due_date, scheduled_date, scheduled_block, completed_at, time_spent, priority, difficulty, needs_reschedule, cleared_at, completion_status, created_at, updated_at';
      const productionColumns = `${baseColumns}, canvas_url, canvas_id`;
      const demoColumns = baseColumns; // demo table doesn't have canvas fields
      
      const columns = isDemo ? demoColumns : productionColumns;
      
      const { data, error: fetchError } = await supabase
        .from(tableName as any)
        .select(columns)
        .eq('user_id', targetUserId)
        .order('due_date', { ascending: true });

      console.log('Raw data from Supabase:', data?.[0]);
      console.log('Columns being selected:', columns);

      if (fetchError) {
        console.error(`Failed to fetch ${isDemo ? 'demo' : 'production'} assignments:`, fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform data to unified format - handle type differences
      const unifiedData: UnifiedAssignment[] = (data || []).map((assignment: any) => ({
        id: assignment.id,
        user_id: assignment.user_id,
        title: assignment.title,
        subject: assignment.subject,
        course_name: assignment.course_name,
        due_date: assignment.due_date,
        scheduled_date: assignment.scheduled_date,
        scheduled_block: assignment.scheduled_block,
        completed_at: assignment.completed_at,
        time_spent: assignment.time_spent,
        priority: assignment.priority,
        difficulty: assignment.difficulty,
        needs_reschedule: assignment.needs_reschedule,
        cleared_at: assignment.cleared_at,
        completion_status: assignment.completion_status,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        // Canvas fields (only exist in production assignments table)
        canvas_url: assignment.canvas_url || null,
        canvas_id: assignment.canvas_id || null,
      }));

      setAssignments(unifiedData);
    } catch (err) {
      console.error(`Error fetching ${isDemo ? 'demo' : 'production'} assignments:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAssignment = async (assignmentId: string, updates: Partial<UnifiedAssignment>) => {
    if (isDemo) {
      // Demo assignments are read-only for now
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from(tableName as any)
        .update(updates as any)
        .eq('id', assignmentId);

      if (updateError) {
        console.error('Failed to update assignment:', updateError);
        setError(updateError.message);
        return;
      }

      // Refresh data after update
      await fetchAssignments(userId);
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAssignments(userId);
    }
  }, [userId, isDemo, refreshKey]);

  return {
    assignments,
    isLoading,
    error,
    refetch: () => fetchAssignments(userId),
    updateAssignment: isDemo ? undefined : updateAssignment
  };
}