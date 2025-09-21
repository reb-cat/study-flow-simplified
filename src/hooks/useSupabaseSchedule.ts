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
        .eq('weekday', dayName)
        .order('start_time');
        
      setIsLoading(false);

      if (fetchError) {
        console.error('Failed to fetch schedule:', fetchError);
        setError(fetchError.message);
        return [];
      }
      
      return data || []; // This has the REAL schedule
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