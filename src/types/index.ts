export interface Profile {
  id: string;
  userId: string;
  role: 'admin' | 'student';
  displayName: string;
}

export interface Assignment {
  id: string;
  profileId: string;
  title: string;
  subject: string;
  dueDate: string;
  scheduledDate?: string;
  scheduledBlock?: number;
  completed: boolean;
  timeSpent: number; // minutes
  canvasId?: string;
  canvasUrl?: string;
  createdAt: string;
  detectedFamily?: string; // Added for family-based scheduling
}

export interface ScheduleTemplate {
  id: string;
  studentName: string;
  weekday: number; // 0-6, Monday = 1
  blockNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  blockType: 'assignment' | 'co-op' | 'break';
}

export interface TimerSession {
  id: string;
  profileId: string;
  startedByUserId: string;
  assignmentId: string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  completed: boolean;
}

export interface ActiveTimer {
  assignmentId: string;
  profileId: string;
  startTime: string;
  elapsedTime: number; // seconds
}

export interface AppUser {
  id: string;
  username: string;
  role: 'admin' | 'student';
  profileId: string;
}