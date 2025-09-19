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
  const { profiles } = useApp();

  // Get weekday name (Monday, Tuesday, etc.)
  const weekdayName = format(date, 'EEEE');
  const dateStr = format(date, 'yyyy-MM-dd');

  console.log('=== useDaySchedule called ===');
  console.log('Student:', studentName);
  console.log('Date:', date);
  console.log('Weekday:', weekdayName);
  console.log('Date string for assignments:', dateStr);

  // Get the student's profile to find their user_id
  const studentProfile = profiles.find(p => p.displayName === studentName);
  const userId = studentProfile?.userId; // Assuming userId maps to the assignments table user_id

  console.log('Student profile:', studentProfile);
  console.log('User ID for assignments:', userId);

  // Fetch schedule template from Supabase
  const { data: scheduleTemplate = [], isLoading: templateLoading, error: templateError } = useQuery({
    queryKey: ['schedule-template', studentName, weekdayName],
    queryFn: async () => {
      console.log('🔍 Fetching schedule for:', studentName, weekdayName);
      const { data, error } = await supabase
        .from('schedule_template')
        .select('*')
        .eq('student_name', studentName)
        .eq('weekday', weekdayName);

      if (error) {
        console.error('❌ Error fetching schedule template:', error);
        return [];
      }

      // Sort by start time to ensure chronological order
      const sortedData = data?.sort((a, b) => {
        const timeA = a.start_time.replace(':', '');
        const timeB = b.start_time.replace(':', '');
        return parseInt(timeA) - parseInt(timeB);
      }) || [];

      console.log('✅ Schedule template data (sorted by time):', sortedData);
      return sortedData;
    }
  });

  // Fetch assignments from Supabase for this student and date
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useQuery({
    queryKey: ['assignments', userId, dateStr],
    queryFn: async () => {
      if (!userId) {
        console.log('❌ No userId, cannot fetch assignments');
        return [];
      }

      console.log('🔍 Fetching assignments for user:', userId, 'date:', dateStr);
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduled_date', dateStr);

      if (error) {
        console.error('❌ Error fetching assignments:', error);
        return [];
      }

      console.log('✅ Found assignments:', data);
      return data || [];
    },
    enabled: !!userId // Only run query if we have a userId
  });

  return useMemo(() => {
    console.log('=== useMemo processing ===');
    console.log('templateLoading:', templateLoading);
    console.log('assignmentsLoading:', assignmentsLoading);
    console.log('scheduleTemplate:', scheduleTemplate);
    console.log('assignments:', assignments);

    const isLoading = templateLoading || assignmentsLoading;

    if (isLoading) {
      console.log('⏳ Still loading...');
      return [];
    }
    
    if (templateError || assignmentsError) {
      console.error('❌ Query errors:', { templateError, assignmentsError });
      return [];
    }

    if (!scheduleTemplate || scheduleTemplate.length === 0) {
      console.log('⚠️ No schedule template found for:', studentName, weekdayName);
      return [];
    }

    console.log('📋 Processing schedule template:', scheduleTemplate);

    // Merge template with assignments
    const schedule: ScheduleBlock[] = scheduleTemplate.map(block => {
      const isAssignmentBlock = block.block_type === 'assignment';
      const assignment = assignments.find(
        a => a.scheduled_block === block.block_number
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
        assignment: assignment ? {
          id: assignment.id,
          profileId: studentProfile?.id || '',
          title: assignment.title,
          subject: assignment.subject,
          dueDate: assignment.due_date,
          scheduledDate: assignment.scheduled_date,
          scheduledBlock: assignment.scheduled_block,
          completed: assignment.completion_status === 'completed',
          timeSpent: assignment.time_spent || 0,
          canvasId: assignment.canvas_id?.toString(),
          canvasUrl: assignment.canvas_url,
          createdAt: assignment.created_at || new Date().toISOString(),
          // Optional enrichment fields
          speechifyUrl: assignment.speechify_url,
          worksheetQuestions: assignment.worksheet_questions,
          interactiveType: ['vocabulary', 'grammar', 'comprehension', 'timeline'].includes(assignment.interactive_type) 
            ? assignment.interactive_type as 'vocabulary' | 'grammar' | 'comprehension' | 'timeline'
            : undefined,
          parentNotes: assignment.parent_notes,
          requiresPrinting: assignment.requires_printing || false
        } : undefined
      };
    });

    console.log('📅 Final schedule:', schedule);
    return schedule;
  }, [studentName, date, scheduleTemplate, assignments, templateLoading, assignmentsLoading, templateError, assignmentsError]);
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