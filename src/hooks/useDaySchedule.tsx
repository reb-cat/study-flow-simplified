import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import { Assignment, ScheduleTemplate } from '@/types';

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
  const { scheduleTemplate, getAssignmentsForProfile, profiles } = useApp();

  return useMemo(() => {
    // Get the weekday (1 = Monday, 2 = Tuesday, etc.)
    const weekday = date.getDay() === 0 ? 7 : date.getDay();
    
    // Get the template for this student and day
    const dayTemplate = scheduleTemplate.filter(
      t => t.studentName === studentName && t.weekday === weekday
    ).sort((a, b) => a.blockNumber - b.blockNumber);

    // Get the student's profile to find their assignments
    const studentProfile = profiles.find(p => p.displayName === studentName);
    if (!studentProfile) return [];

    // Get assignments scheduled for this date
    const dateStr = format(date, 'yyyy-MM-dd');
    const studentAssignments = getAssignmentsForProfile(studentProfile.id);
    const scheduledAssignments = studentAssignments.filter(
      a => a.scheduledDate === dateStr
    );

    // Merge template with assignments
    const schedule: ScheduleBlock[] = dayTemplate.map(block => {
      const isAssignmentBlock = block.blockType === 'assignment';
      const assignment = scheduledAssignments.find(
        a => a.scheduledBlock === block.blockNumber
      );

      return {
        id: block.id,
        blockNumber: block.blockNumber,
        startTime: block.startTime,
        endTime: block.endTime,
        subject: block.subject,
        blockType: block.blockType as any,
        isFixed: !isAssignmentBlock,
        isOpen: isAssignmentBlock && !assignment,
        assignment: assignment
      };
    });

    return schedule;
  }, [studentName, date, scheduleTemplate, getAssignmentsForProfile, profiles]);
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