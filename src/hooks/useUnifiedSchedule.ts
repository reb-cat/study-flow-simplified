import { useState, useEffect, useCallback } from 'react';
import { useSupabaseSchedule, SupabaseScheduleBlock } from './useSupabaseSchedule';
import { useApp } from '@/context/AppContext';

interface DemoScheduleBlock {
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
 * Unified hook that returns demo or real schedule data based on user type
 * Uses the same logic for both, just different data sources
 */
export function useUnifiedSchedule() {
  const { currentUser, isDemo, scheduleTemplate } = useApp();
  const { getScheduleForDay, isLoading: supabaseLoading, error: supabaseError } = useSupabaseSchedule();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get schedule for a specific day
  const getScheduleForStudent = useCallback(async (studentName: string, dayName: string): Promise<SupabaseScheduleBlock[]> => {
    if (isDemo) {
      // Demo mode - use localStorage data
      setIsLoading(true);
      setError(null);
      
      try {
        // Convert demo schedule template to match SupabaseScheduleBlock format
        const daySchedule = scheduleTemplate
          .filter(s => s.studentName === studentName && s.weekday === getDayNumber(dayName))
          .map(s => ({
            id: `demo-${s.id}`,
            student_name: s.studentName,
            weekday: dayName,
            block_number: s.blockNumber,
            start_time: s.startTime,
            end_time: s.endTime,
            subject: s.subject,
            block_name: null,
            block_type: s.blockType
          }));
        
        setIsLoading(false);
        return daySchedule;
      } catch (err) {
        setIsLoading(false);
        setError('Failed to load demo schedule');
        return [];
      }
    } else {
      // Real mode - use Supabase
      setIsLoading(supabaseLoading);
      setError(supabaseError);
      return await getScheduleForDay(studentName, dayName);
    }
  }, [isDemo, scheduleTemplate, getScheduleForDay, supabaseLoading, supabaseError]);

  // Helper function to convert day name to number (for demo mode compatibility)
  const getDayNumber = (dayName: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  return {
    getScheduleForStudent,
    isLoading,
    error
  };
}