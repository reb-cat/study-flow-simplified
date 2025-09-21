import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseScheduleBlock {
  id: string;
  student_name: string;
  weekday: string;
  block_number: number | null;
  start_time: string;
  end_time: string;
  subject: string;
  block_name: string | null;
  block_type: string;
}

/**
 * Hook to fetch real schedule data from Supabase schedule_template table
 */
export function useSupabaseSchedule() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This is the ONLY way to get schedule data
  const getScheduleForDay = useCallback(async (studentName: string, dayName: string): Promise<SupabaseScheduleBlock[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('schedule_template')
        .select('*')
        .eq('student_name', studentName)
        .eq('weekday', dayName);
        
      setIsLoading(false);

      if (fetchError) {
        console.error('Failed to fetch schedule:', fetchError);
        setError(fetchError.message);
        return [];
      }
      
      // Sort by time client-side since Supabase REST API doesn't support ::time casting
      const sortedData = (data || []).sort((a, b) => {
        // Convert HH:MM to minutes for proper sorting
        const timeToMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
      });
      
      return sortedData;
    } catch (err) {
      setIsLoading(false);
      console.error('Network error fetching schedule:', err);
      setError('Network error - please try again');
      return [];
    }
  }, []);

  return {
    getScheduleForDay,
    isLoading,
    error
  };
}