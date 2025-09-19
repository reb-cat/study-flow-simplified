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
      userId: 'abigail-user', // Fixed to match database
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
    // Khalil's Monday Schedule - Full Spine Example
    { id: 'khalil-mon-1', studentName: 'Khalil', weekday: 1, blockNumber: 1, startTime: '09:00', endTime: '09:20', subject: 'Bible', blockType: 'break' },
    { id: 'khalil-mon-2', studentName: 'Khalil', weekday: 1, blockNumber: 2, startTime: '09:20', endTime: '09:50', subject: 'Math', blockType: 'assignment' },
    { id: 'khalil-mon-3', studentName: 'Khalil', weekday: 1, blockNumber: 3, startTime: '09:50', endTime: '10:20', subject: 'English', blockType: 'assignment' },
    { id: 'khalil-mon-4', studentName: 'Khalil', weekday: 1, blockNumber: 4, startTime: '10:20', endTime: '10:30', subject: 'Break', blockType: 'break' },
    { id: 'khalil-mon-5', studentName: 'Khalil', weekday: 1, blockNumber: 5, startTime: '10:30', endTime: '11:20', subject: 'History', blockType: 'assignment' },
    { id: 'khalil-mon-6', studentName: 'Khalil', weekday: 1, blockNumber: 6, startTime: '11:20', endTime: '12:20', subject: 'Earth Science', blockType: 'co-op' },
    { id: 'khalil-mon-7', studentName: 'Khalil', weekday: 1, blockNumber: 7, startTime: '12:20', endTime: '13:00', subject: 'Lunch', blockType: 'break' },
    
    // Khalil's Tuesday Schedule
    { id: 'khalil-tue-1', studentName: 'Khalil', weekday: 2, blockNumber: 1, startTime: '09:00', endTime: '09:20', subject: 'Bible', blockType: 'break' },
    { id: 'khalil-tue-2', studentName: 'Khalil', weekday: 2, blockNumber: 2, startTime: '09:20', endTime: '09:50', subject: 'Science', blockType: 'assignment' },
    { id: 'khalil-tue-3', studentName: 'Khalil', weekday: 2, blockNumber: 3, startTime: '09:50', endTime: '10:20', subject: 'Career Prep', blockType: 'assignment' },
    { id: 'khalil-tue-4', studentName: 'Khalil', weekday: 2, blockNumber: 4, startTime: '10:30', endTime: '11:20', subject: 'Math', blockType: 'assignment' },
    { id: 'khalil-tue-5', studentName: 'Khalil', weekday: 2, blockNumber: 5, startTime: '11:20', endTime: '12:20', subject: 'Earth Science', blockType: 'co-op' },
    
    // Khalil's Wednesday Schedule
    { id: 'khalil-wed-1', studentName: 'Khalil', weekday: 3, blockNumber: 1, startTime: '09:00', endTime: '09:20', subject: 'Bible', blockType: 'break' },
    { id: 'khalil-wed-2', studentName: 'Khalil', weekday: 3, blockNumber: 2, startTime: '09:20', endTime: '09:50', subject: 'English', blockType: 'assignment' },
    { id: 'khalil-wed-3', studentName: 'Khalil', weekday: 3, blockNumber: 3, startTime: '09:50', endTime: '10:20', subject: 'History', blockType: 'assignment' },
    { id: 'khalil-wed-4', studentName: 'Khalil', weekday: 3, blockNumber: 4, startTime: '10:30', endTime: '11:20', subject: 'Science', blockType: 'assignment' },
    
    // Khalil's Thursday Schedule
    { id: 'khalil-thu-1', studentName: 'Khalil', weekday: 4, blockNumber: 1, startTime: '09:00', endTime: '09:20', subject: 'Bible', blockType: 'break' },
    { id: 'khalil-thu-2', studentName: 'Khalil', weekday: 4, blockNumber: 2, startTime: '09:20', endTime: '09:50', subject: 'Math', blockType: 'assignment' },
    { id: 'khalil-thu-3', studentName: 'Khalil', weekday: 4, blockNumber: 3, startTime: '09:50', endTime: '10:20', subject: 'Career Prep', blockType: 'assignment' },
    { id: 'khalil-thu-4', studentName: 'Khalil', weekday: 4, blockNumber: 4, startTime: '11:20', endTime: '12:20', subject: 'Earth Science', blockType: 'co-op' },
    
    // Khalil's Friday Schedule
    { id: 'khalil-fri-1', studentName: 'Khalil', weekday: 5, blockNumber: 1, startTime: '09:00', endTime: '09:20', subject: 'Bible', blockType: 'break' },
    { id: 'khalil-fri-2', studentName: 'Khalil', weekday: 5, blockNumber: 2, startTime: '09:20', endTime: '09:50', subject: 'Review', blockType: 'assignment' },
    { id: 'khalil-fri-3', studentName: 'Khalil', weekday: 5, blockNumber: 3, startTime: '09:50', endTime: '10:20', subject: 'Study Hall', blockType: 'assignment' },

    // Abigail's Schedule (Simpler for demo)
    { id: 'abi-mon-1', studentName: 'Abigail', weekday: 1, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'Math', blockType: 'assignment' },
    { id: 'abi-mon-2', studentName: 'Abigail', weekday: 1, blockNumber: 2, startTime: '09:40', endTime: '10:20', subject: 'English', blockType: 'assignment' },
    { id: 'abi-mon-3', studentName: 'Abigail', weekday: 1, blockNumber: 3, startTime: '10:30', endTime: '11:10', subject: 'Science', blockType: 'assignment' },
    { id: 'abi-tue-1', studentName: 'Abigail', weekday: 2, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'English', blockType: 'assignment' },
    { id: 'abi-tue-2', studentName: 'Abigail', weekday: 2, blockNumber: 2, startTime: '09:40', endTime: '10:20', subject: 'Math', blockType: 'assignment' },
    { id: 'abi-wed-1', studentName: 'Abigail', weekday: 3, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'Science', blockType: 'assignment' },
    { id: 'abi-thu-1', studentName: 'Abigail', weekday: 4, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'Math', blockType: 'assignment' },
    { id: 'abi-fri-1', studentName: 'Abigail', weekday: 5, blockNumber: 1, startTime: '08:30', endTime: '09:30', subject: 'Review', blockType: 'assignment' },
  ];

  const assignments: Assignment[] = [
    // Khalil's assignments - Some scheduled to specific blocks
    {
      id: 'assign-khalil-1',
      profileId: 'profile-khalil',
      title: 'Chemistry Chapter 5 Review',
      subject: 'Science',
      dueDate: '2024-09-20',
      scheduledDate: '2024-09-18',
      scheduledBlock: 2,
      completed: false,
      timeSpent: 25,
      canvasUrl: 'https://canvas.example.com/courses/123/assignments/456',
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-khalil-2',
      profileId: 'profile-khalil',
      title: 'Constitutional Convention Notes',
      subject: 'History',
      dueDate: '2024-09-19',
      scheduledDate: '2024-09-18',
      scheduledBlock: 5,
      completed: false,
      timeSpent: 15,
      speechifyUrl: 'https://speechify.app.link/constitutional-convention',
      worksheetQuestions: '1. What were the four main issues debated?\n2. When did the Convention meet?\n3. Who were the key delegates?',
      interactiveType: 'timeline',
      parentNotes: 'Focus on the timeline - this is tricky for him',
      requiresPrinting: true,
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-khalil-3',
      profileId: 'profile-khalil',
      title: 'Resume Update Project',
      subject: 'Career Prep',
      dueDate: '2024-09-21',
      scheduledDate: '2024-09-19',
      scheduledBlock: 3,
      completed: false,
      timeSpent: 30,
      parentNotes: 'Needs help formatting',
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-khalil-4',
      profileId: 'profile-khalil',
      title: 'Algebra II Problem Set 3.2',
      subject: 'Math',
      dueDate: '2024-09-20',
      scheduledDate: '2024-09-19',
      scheduledBlock: 4,
      completed: false,
      timeSpent: 0,
      worksheetQuestions: 'Problems 1-15 (odd numbers only)\nShow all work for partial credit',
      requiresPrinting: true,
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-khalil-unscheduled-1',
      profileId: 'profile-khalil',
      title: 'English Essay Draft',
      subject: 'English',
      dueDate: '2024-09-22',
      // No scheduledDate or scheduledBlock - should appear in unscheduled pool
      completed: false,
      timeSpent: 0,
      worksheetQuestions: 'Thesis statement and outline\n3 supporting paragraphs\nConclusion',
      parentNotes: 'Help with thesis statement',
      createdAt: '2024-09-15T08:00:00Z'
    },
    {
      id: 'assign-khalil-unscheduled-2',
      profileId: 'profile-khalil',
      title: 'Geography Map Quiz Prep',
      subject: 'History',
      dueDate: '2024-09-23',
      // No scheduledDate or scheduledBlock
      completed: false,
      timeSpent: 0,
      interactiveType: 'vocabulary',
      createdAt: '2024-09-15T08:00:00Z'
    },

    // Abigail's assignments
    {
      id: 'assign-abi-1',
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
      id: 'assign-abi-2',
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
      id: 'assign-abi-3',
      profileId: 'profile-abigail',
      title: 'Science Lab Prep',
      subject: 'Science',
      dueDate: '2024-09-20',
      scheduledDate: '2024-09-19',
      scheduledBlock: 1,
      completed: false,
      timeSpent: 15,
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