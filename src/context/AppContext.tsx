import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, Assignment, ScheduleTemplate, TimerSession, ActiveTimer, AppUser } from '@/types';
import { generateDemoData } from '@/lib/demo-data';

interface AppContextType {
  // Auth state
  currentUser: AppUser | null;
  isDemo: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  
  // Profile management
  profiles: Profile[];
  selectedProfile: Profile | null;
  setSelectedProfile: (profile: Profile) => void;
  
  // Assignment management
  assignments: Assignment[];
  getAssignmentsForProfile: (profileId: string) => Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  
  // Schedule
  scheduleTemplate: ScheduleTemplate[];
  getScheduleForStudent: (studentName: string, weekday: number) => ScheduleTemplate[];
  
  // Timer management
  activeTimer: ActiveTimer | null;
  timerSessions: TimerSession[];
  startTimer: (assignmentId: string, profileId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  getTimerForAssignment: (assignmentId: string) => number; // total seconds
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [scheduleTemplate, setScheduleTemplate] = useState<ScheduleTemplate[]>([]);
  const [timerSessions, setTimerSessions] = useState<TimerSession[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Load data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('mission-hub-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setProfiles(data.profiles || []);
        setAssignments(data.assignments || []);
        setScheduleTemplate(data.scheduleTemplate || []);
        setTimerSessions(data.timerSessions || []);
        setCurrentUser(data.currentUser || null);
        setSelectedProfile(data.selectedProfile || null);
        setActiveTimer(data.activeTimer || null);
        setIsDemo(data.isDemo || false);
      } catch (error) {
        console.error('Failed to load saved data:', error);
        initializeDemoData();
      }
    } else {
      initializeDemoData();
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const data = {
      profiles,
      assignments,
      scheduleTemplate,
      timerSessions,
      currentUser,
      selectedProfile,
      activeTimer,
      isDemo,
    };
    localStorage.setItem('mission-hub-data', JSON.stringify(data));
  }, [profiles, assignments, scheduleTemplate, timerSessions, currentUser, selectedProfile, activeTimer, isDemo]);

  // Timer tick effect
  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          elapsedTime: prev.elapsedTime + 1
        };
      });

      // Auto-save every minute
      if (activeTimer.elapsedTime % 60 === 0) {
        const assignment = assignments.find(a => a.id === activeTimer.assignmentId);
        if (assignment) {
          updateAssignment(assignment.id, {
            timeSpent: assignment.timeSpent + 1
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, assignments]);

  const initializeDemoData = () => {
    console.log('Initializing demo data...'); // Debug
    const demoData = generateDemoData();
    setProfiles(demoData.profiles);
    setAssignments(demoData.assignments);
    setScheduleTemplate(demoData.scheduleTemplate);
    setTimerSessions(demoData.timerSessions);
    console.log('Demo data initialized:', demoData.profiles.length, 'profiles'); // Debug
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    console.log('Login attempt:', username, 'Available profiles:', profiles.length); // Debug
    
    // If no profiles exist, initialize demo data first
    if (profiles.length === 0) {
      console.log('No profiles found, initializing demo data...'); // Debug
      initializeDemoData();
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Demo mode login
    if (username === 'demo' || username === 'admin' || username === 'parent') {
      const adminProfile = profiles.find(p => p.role === 'admin');
      console.log('Looking for admin profile:', adminProfile); // Debug
      if (adminProfile) {
        const user: AppUser = {
          id: 'demo-admin',
          username: 'Parent Admin',
          role: 'admin',
          profileId: adminProfile.id
        };
        setCurrentUser(user);
        setSelectedProfile(profiles.find(p => p.displayName === 'Abigail') || profiles[0]);
        setIsDemo(true);
        return true;
      }
    }

    if (username === 'abigail') {
      const abigailProfile = profiles.find(p => p.displayName === 'Abigail');
      console.log('Looking for Abigail profile:', abigailProfile); // Debug
      if (abigailProfile) {
        const user: AppUser = {
          id: 'demo-abigail',
          username: 'Abigail',
          role: 'student',
          profileId: abigailProfile.id
        };
        setCurrentUser(user);
        setSelectedProfile(abigailProfile);
        setIsDemo(true);
        return true;
      }
    }

    if (username === 'khalil') {
      const khalilProfile = profiles.find(p => p.displayName === 'Khalil');
      console.log('Looking for Khalil profile:', khalilProfile); // Debug
      if (khalilProfile) {
        const user: AppUser = {
          id: 'demo-khalil',
          username: 'Khalil',
          role: 'student',
          profileId: khalilProfile.id
        };
        setCurrentUser(user);
        setSelectedProfile(khalilProfile);
        setIsDemo(true);
        return true;
      }
    }

    console.log('Login failed - no matching profile found'); // Debug
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedProfile(null);
    setActiveTimer(null);
    setIsDemo(false);
  };

  const getAssignmentsForProfile = (profileId: string) => {
    return assignments.filter(a => a.profileId === profileId);
  };

  const addAssignment = (assignment: Omit<Assignment, 'id' | 'createdAt'>) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    // Stop timer if it's for this assignment
    if (activeTimer?.assignmentId === id) {
      stopTimer();
    }
  };

  const getScheduleForStudent = (studentName: string, weekday: number) => {
    return scheduleTemplate.filter(s => s.studentName === studentName && s.weekday === weekday);
  };

  const startTimer = (assignmentId: string, profileId: string) => {
    // Stop any existing timer for this profile
    if (activeTimer && activeTimer.profileId === profileId) {
      stopTimer();
    }

    setActiveTimer({
      assignmentId,
      profileId,
      startTime: new Date().toISOString(),
      elapsedTime: 0
    });
  };

  const pauseTimer = () => {
    if (activeTimer) {
      // Save the elapsed time to the assignment
      const assignment = assignments.find(a => a.id === activeTimer.assignmentId);
      if (assignment) {
        updateAssignment(assignment.id, {
          timeSpent: assignment.timeSpent + Math.floor(activeTimer.elapsedTime / 60)
        });
      }
      setActiveTimer(null);
    }
  };

  const resumeTimer = () => {
    // This would be called from a paused state - for now just treat as start
    if (activeTimer) {
      setActiveTimer({
        ...activeTimer,
        startTime: new Date().toISOString(),
        elapsedTime: 0
      });
    }
  };

  const stopTimer = () => {
    if (activeTimer) {
      // Save the elapsed time to the assignment
      const assignment = assignments.find(a => a.id === activeTimer.assignmentId);
      if (assignment) {
        updateAssignment(assignment.id, {
          timeSpent: assignment.timeSpent + Math.floor(activeTimer.elapsedTime / 60)
        });
      }

      // Create timer session
      const session: TimerSession = {
        id: `session-${Date.now()}`,
        profileId: activeTimer.profileId,
        startedByUserId: currentUser?.id || '',
        assignmentId: activeTimer.assignmentId,
        startTime: activeTimer.startTime,
        endTime: new Date().toISOString(),
        duration: activeTimer.elapsedTime,
        completed: true
      };
      setTimerSessions(prev => [...prev, session]);
      setActiveTimer(null);
    }
  };

  const getTimerForAssignment = (assignmentId: string) => {
    return timerSessions
      .filter(s => s.assignmentId === assignmentId)
      .reduce((total, session) => total + session.duration, 0);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      isDemo,
      login,
      logout,
      profiles,
      selectedProfile,
      setSelectedProfile,
      assignments,
      getAssignmentsForProfile,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      scheduleTemplate,
      getScheduleForStudent,
      activeTimer,
      timerSessions,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      getTimerForAssignment,
    }}>
      {children}
    </AppContext.Provider>
  );
};