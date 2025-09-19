import { Profile, Assignment, ScheduleTemplate, TimerSession } from '@/types';

export const generateDemoData = () => {
  const profiles: Profile[] = [
    {
      id: 'profile-admin',
      userId: 'user-admin',
      role: 'admin',
      displayName: 'Parent Admin'
    },
    {
      id: 'profile-abigail',
      userId: 'user-abigail',
      role: 'student',
      displayName: 'Abigail'
    },
    {
      id: 'profile-khalil',
      userId: 'user-khalil',
      role: 'student',
      displayName: 'Khalil'
    }
  ];

  const scheduleTemplate: ScheduleTemplate[] = [
    // Abigail's schedule
    { id: 'sched-1', studentName: 'Abigail', weekday: 1, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'Math', blockType: 'assignment' },
    { id: 'sched-2', studentName: 'Abigail', weekday: 1, blockNumber: 2, startTime: '09:40', endTime: '10:20', subject: 'English', blockType: 'assignment' },
    { id: 'sched-3', studentName: 'Abigail', weekday: 1, blockNumber: 3, startTime: '10:30', endTime: '11:10', subject: 'Science', blockType: 'assignment' },
    { id: 'sched-4', studentName: 'Abigail', weekday: 2, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'English', blockType: 'assignment' },
    { id: 'sched-5', studentName: 'Abigail', weekday: 2, blockNumber: 2, startTime: '09:40', endTime: '10:20', subject: 'Math', blockType: 'assignment' },
    { id: 'sched-6', studentName: 'Abigail', weekday: 3, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'Science', blockType: 'assignment' },
    { id: 'sched-7', studentName: 'Abigail', weekday: 4, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'Math', blockType: 'assignment' },
    { id: 'sched-8', studentName: 'Abigail', weekday: 5, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'Review', blockType: 'assignment' },

    // Khalil's schedule
    { id: 'sched-9', studentName: 'Khalil', weekday: 1, blockNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Chemistry', blockType: 'assignment' },
    { id: 'sched-10', studentName: 'Khalil', weekday: 2, blockNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Co-op', blockType: 'co-op' },
    { id: 'sched-11', studentName: 'Khalil', weekday: 3, blockNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Career', blockType: 'assignment' },
    { id: 'sched-12', studentName: 'Khalil', weekday: 4, blockNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Chemistry', blockType: 'assignment' },
    { id: 'sched-13', studentName: 'Khalil', weekday: 4, blockNumber: 2, startTime: '10:15', endTime: '11:15', subject: 'Career', blockType: 'assignment' },
  ];

  const assignments: Assignment[] = [
    // Abigail's assignments
    {
      id: 'assign-1',
      profileId: 'profile-abigail',
      title: 'Algebra Practice Set',
      subject: 'Math',
      dueDate: '2024-09-20',
      scheduledDate: '2024-09-18',
      scheduledBlock: 1,
      completed: false,
      timeSpent: 25,
      canvasUrl: 'https://canvas.example.com/courses/123/assignments/456',
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-2',
      profileId: 'profile-abigail',
      title: 'Novel Chapter 3 Notes',
      subject: 'English',
      dueDate: '2024-09-19',
      scheduledDate: '2024-09-17',
      scheduledBlock: 2,
      completed: true,
      timeSpent: 40,
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-3',
      profileId: 'profile-abigail',
      title: 'Science Lab Prep',
      subject: 'Science',
      dueDate: '2024-09-20',
      scheduledDate: '2024-09-19',
      scheduledBlock: 1,
      completed: false,
      timeSpent: 15,
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-4',
      profileId: 'profile-abigail',
      title: 'Geometry Worksheet',
      subject: 'Math',
      dueDate: '2024-09-21',
      scheduledDate: '2024-09-19',
      scheduledBlock: 1,
      completed: false,
      timeSpent: 0,
      createdAt: '2024-09-15T08:00:00Z'
    },

    // Khalil's assignments
    {
      id: 'assign-5',
      profileId: 'profile-khalil',
      title: 'Resume Update',
      subject: 'Career',
      dueDate: '2024-09-18',
      scheduledDate: '2024-09-17',
      scheduledBlock: 1,
      completed: false,
      timeSpent: 30,
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-6',
      profileId: 'profile-khalil',
      title: 'Chemistry HW 2',
      subject: 'Chemistry',
      dueDate: '2024-09-20',
      scheduledDate: '2024-09-19',
      scheduledBlock: 2,
      completed: false,
      timeSpent: 45,
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-7',
      profileId: 'profile-khalil',
      title: 'Job Application Research',
      subject: 'Career',
      dueDate: '2024-09-19',
      scheduledDate: '2024-09-18',
      scheduledBlock: 1,
      completed: true,
      timeSpent: 60,
      createdAt: '2024-09-15T08:00:00Z'
    }
  ];

  const timerSessions: TimerSession[] = [
    {
      id: 'session-1',
      profileId: 'profile-abigail',
      startedByUserId: 'user-abigail',
      assignmentId: 'assign-2',
      startTime: '2024-09-16T09:00:00Z',
      endTime: '2024-09-16T09:40:00Z',
      duration: 2400, // 40 minutes in seconds
      completed: true
    },
    {
      id: 'session-2',
      profileId: 'profile-khalil',
      startedByUserId: 'user-khalil',
      assignmentId: 'assign-7',
      startTime: '2024-09-15T14:00:00Z',
      endTime: '2024-09-15T15:00:00Z',
      duration: 3600, // 60 minutes in seconds
      completed: true
    }
  ];

  return {
    profiles,
    scheduleTemplate,
    assignments,
    timerSessions
  };
};