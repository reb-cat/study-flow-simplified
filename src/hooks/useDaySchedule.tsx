import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import { Assignment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface ScheduleBlock {
  id: string;
  blockNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  blockType: 'assignment' | 'co-op' | 'break' | 'bible' | 'lunch';
  isFixed: boolean;
  isOpen: boolean;
  assignment?: Assignment;
}

export const useDaySchedule = (studentName: string, date: Date) => {
  const { getAssignmentsForProfile, profiles } = useApp();

  // Get weekday name (Monday, Tuesday, etc.)
  const weekdayName = format(date, 'EEEE');

  // Fetch schedule template from Supabase
  const { data: scheduleTemplate = [], isLoading, error } = useQuery({
    queryKey: ['schedule-template', studentName, weekdayName],
    queryFn: async () => {
      console.log('Fetching schedule for:', studentName, weekdayName);
      const { data, error } = await supabase
        .from('schedule_template')
        .select('*')
        .eq('student_name', studentName)
        .eq('weekday', weekdayName)
        .order('block_number');

      if (error) {
        console.error('Error fetching schedule template:', error);
        return [];
      }

      console.log('Schedule template data:', data);
      return data || [];
    }
  });

  return useMemo(() => {
    if (isLoading) {
      console.log('Schedule loading...');
      return [];
    }
    
    if (error) {
      console.error('Schedule query error:', error);
      return [];
    }

    if (!scheduleTemplate || scheduleTemplate.length === 0) {
      console.log('No schedule template found for:', studentName, weekdayName);
      return [];
    }

    console.log('Processing schedule template:', scheduleTemplate);

    // Get the student's profile to find their assignments
    const studentProfile = profiles.find(p => p.displayName === studentName);
    if (!studentProfile) {
      console.log('No student profile found for:', studentName);
      return [];
    }

    // Get assignments scheduled for this date
    const dateStr = format(date, 'yyyy-MM-dd');
    const studentAssignments = getAssignmentsForProfile(studentProfile.id);
    const scheduledAssignments = studentAssignments.filter(
      a => a.scheduledDate === dateStr
    );

    console.log('Scheduled assignments for', dateStr, ':', scheduledAssignments);

    // Merge template with assignments
    const schedule: ScheduleBlock[] = scheduleTemplate.map(block => {
      const isAssignmentBlock = block.block_type === 'Assignment';
      const assignment = scheduledAssignments.find(
        a => a.scheduledBlock === block.block_number
      );

      return {
        id: block.id,
        blockNumber: block.block_number,
        startTime: block.start_time,
        endTime: block.end_time,
        subject: block.subject,
        blockType: block.block_type as any,
        isFixed: !isAssignmentBlock,
        isOpen: isAssignmentBlock && !assignment,
        assignment: assignment
      };
    });

    console.log('Final schedule:', schedule);
    return schedule;
  }, [studentName, date, scheduleTemplate, getAssignmentsForProfile, profiles, isLoading, error]);
};

export const useWeekSchedule = (studentName: string, weekStart: Date) => {
  return useMemo(() => {
    const weekDays = Array.from({ length: 5 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return weekDays.map(day => ({
      date: day,
      dayName: format(day, 'EEEE'),
      schedule: useDaySchedule(studentName, day)
    }));
  }, [studentName, weekStart]);
};