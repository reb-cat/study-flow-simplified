import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types';
import { addFamilyToAssignment } from '@/lib/family-detection';

export const useSupabaseAssignments = (userId?: string) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAssignments = async () => {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

        // Convert Supabase assignments to our Assignment type and add family detection
        const convertedAssignments: Assignment[] = (data || []).map(dbAssignment => {
          const assignment: Assignment = {
            id: dbAssignment.id,
            profileId: userId, // Map user_id to profileId
            title: dbAssignment.title,
            subject: dbAssignment.subject || dbAssignment.course_name || 'General',
            dueDate: dbAssignment.due_date || new Date().toISOString(),
            scheduledDate: dbAssignment.scheduled_date || undefined,
            scheduledBlock: dbAssignment.scheduled_block || undefined,
            completed: dbAssignment.completion_status === 'completed',
            timeSpent: Math.floor((dbAssignment.time_spent || 0) / 60), // Convert seconds to minutes
            canvasId: dbAssignment.canvas_id?.toString(),
            canvasUrl: dbAssignment.canvas_url || undefined,
            createdAt: dbAssignment.created_at || new Date().toISOString(),
          };

          // Add family detection
          return addFamilyToAssignment(assignment);
        });

        setAssignments(convertedAssignments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [userId]);

  return {
    assignments,
    loading,
    error
  };
};