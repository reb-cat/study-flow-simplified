import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Profile, Assignment, ScheduleTemplate, TimerSession, ActiveTimer, AppUser } from '@/types';
import { generateDemoData } from '@/lib/demo-data';
import { supabase } from '@/integrations/supabase/client';

// Email to user-id mapping function
const getUserIdFromEmail = (email: string): string => {
  switch (email.toLowerCase()) {
    case 'khalilsjh10@gmail.com':
      return 'khalil';
    case 'sweetpeaag120@gmail.com':
      return 'abigail';
    default:
      // For demo users or unknown emails, use email prefix as fallback
      return email.split('@')[0];
  }
};

interface AppContextType {
  // Auth state
  currentUser: AppUser | null;
  isDemo: boolean;
  userRole: 'admin' | 'student' | 'demo';
  isAdmin: boolean;
  isDemoUser: boolean;
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

  // Save data to localStorage whenever state changes (debounced to avoid excessive writes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
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
    }, 1000);

    return () => clearTimeout(timeoutId);
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

      if (activeTimer.elapsedTime % 60 === 0) {
        setAssignments(prevAssignments => {
          const assignment = prevAssignments.find(a => a.id === activeTimer.assignmentId);
          if (assignment) {
            return prevAssignments.map(a => 
              a.id === activeTimer.assignmentId 
                ? { ...a, timeSpent: a.timeSpent + 1 }
                : a
            );
          }
          return prevAssignments;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.assignmentId]);

  const initializeDemoData = () => {
    console.log('Initializing demo data...');
    const demoData = generateDemoData();
    setProfiles(demoData.profiles);
    setAssignments(demoData.assignments);
    setScheduleTemplate(demoData.scheduleTemplate);
    setTimerSessions(demoData.timerSessions);
    console.log('Demo data initialized:', demoData.profiles.length, 'profiles');
  };

  const login = useCallback(async (username: string, password?: string): Promise<boolean> => {
    console.log('AppContext login called with username:', username);

    // Check if user is already authenticated - retry if needed
    let session = null;
    let retries = 3;
    
    while (retries > 0 && !session) {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      session = currentSession;
      if (!session) {
        console.log('Session not yet available, retrying...', retries);
        await new Promise(resolve => setTimeout(resolve, 200));
        retries--;
      }
    }
    
    if (session?.user) {
      console.log('User authenticated with Supabase:', session.user.email);
      
      // Fetch user roles from database
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_roles', { _user_id: session.user.id });
      
      let userRole: 'admin' | 'student' = 'student';
      if (!roleError && roleData) {
        const hasAdminRole = roleData.some((r: { role: string }) => r.role === 'admin');
        userRole = hasAdminRole ? 'admin' : 'student';
      }
      
      // For real authenticated users, use mapped student name
      const studentName = getUserIdFromEmail(session.user.email || '');
      const { data: profileData } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('student_name', studentName)
        .maybeSingle();
      
      let displayName = studentName;
      if (profileData) {
        displayName = profileData.display_name || studentName;
      }
      
      const user: AppUser = {
        id: session.user.id,
        username: displayName,
        role: userRole,
        profileId: session.user.id
      };
      
      const defaultProfile: Profile = {
        id: session.user.id,
        userId: session.user.id,
        displayName: displayName,
        role: userRole
      };
      
      setCurrentUser(user);
      setProfiles([defaultProfile]);
      setSelectedProfile(defaultProfile);
      setIsDemo(false);
      return true;
    }

    // Demo mode authentication
    let cleanUsername = username;
    if (username.includes('@')) {
      cleanUsername = username.split('@')[0].replace('demo-', '');
    }

    if (cleanUsername.includes('demo') || username.includes('demo')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `demo-${cleanUsername}@studyflow.demo`,
          password: password || 'demo-password'
        });

        if (error) {
          console.error('Supabase auth error:', error);
          return false;
        }

        console.log('Supabase auth successful for:', data.user?.email);
      } catch (error) {
        console.error('Auth error:', error);
        return false;
      }

      // Set up demo data
      let currentProfiles = profiles;
      if (currentProfiles.length === 0) {
        const demoData = generateDemoData();
        currentProfiles = demoData.profiles;
        setProfiles(demoData.profiles);
        setAssignments(demoData.assignments);
        setScheduleTemplate(demoData.scheduleTemplate);
        setTimerSessions(demoData.timerSessions);
      }

      // Demo user login
      if (cleanUsername === 'demo' || cleanUsername === 'admin' || cleanUsername === 'parent') {
        const adminProfile = currentProfiles.find(p => p.role === 'admin');
        if (adminProfile) {
          const user: AppUser = {
            id: 'demo-admin',
            username: 'Parent Admin',
            role: 'admin',
            profileId: adminProfile.id
          };
          setCurrentUser(user);
          setSelectedProfile(currentProfiles.find(p => p.displayName === 'Abigail') || currentProfiles[0]);
          setIsDemo(true);
          return true;
        }
      }

      if (cleanUsername === 'abigail') {
        const abigailProfile = currentProfiles.find(p => p.displayName === 'Abigail');
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

      if (cleanUsername === 'khalil') {
        const khalilProfile = currentProfiles.find(p => p.displayName === 'Khalil');
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
    }

    return false;
  }, [profiles]);

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSelectedProfile(null);
    setActiveTimer(null);
    setIsDemo(false);
  };

  useEffect(() => {
    let mounted = true;

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 AppContext Debug - Session check:', session?.user?.email);

      if (session?.user?.email && mounted) {
          const email = session.user.email;
          console.log('Found existing session for:', email);

          if (email.startsWith('demo-')) {
            const username = email.replace('demo-', '').split('@')[0];
            let currentProfiles = profiles;
            if (currentProfiles.length === 0) {
              const demoData = generateDemoData();
              currentProfiles = demoData.profiles;
              setProfiles(demoData.profiles);
              setAssignments(demoData.assignments);
              setScheduleTemplate(demoData.scheduleTemplate);
              setTimerSessions(demoData.timerSessions);
            }

            if (username === 'admin') {
              const adminProfile = currentProfiles.find(p => p.role === 'admin');
              if (adminProfile) {
                const user: AppUser = {
                  id: 'demo-admin',
                  username: 'Parent Admin',
                  role: 'admin',
                  profileId: adminProfile.id
                };
                setCurrentUser(user);
                setSelectedProfile(currentProfiles.find(p => p.displayName === 'Abigail') || currentProfiles[0]);
                setIsDemo(true);
              }
            } else {
              const profile = currentProfiles.find(
                (p: Profile) => p.displayName.toLowerCase() === username.toLowerCase()
              );

              if (profile) {
                const user: AppUser = {
                  id: `demo-${username}`,
                  username: profile.displayName,
                  role: 'student',
                  profileId: profile.id
                };

                setCurrentUser(user);
                setSelectedProfile(profile);
                setIsDemo(true);
              }
            }
          } else {
            // Real authenticated user
            const studentName = getUserIdFromEmail(email);
            const { data: profileData } = await supabase
              .from('student_profiles')
              .select('*')
              .eq('student_name', studentName)
              .maybeSingle();
              
            let displayName = studentName;
            if (profileData) {
              displayName = profileData.display_name || studentName;
            }
            
            const { data: roleData } = await supabase
              .rpc('get_user_roles', { _user_id: session.user.id });
            
            let userRole: 'admin' | 'student' = 'student';
            if (roleData) {
              const hasAdminRole = roleData.some((r: { role: string }) => r.role === 'admin');
              userRole = hasAdminRole ? 'admin' : 'student';
            }
            
            const user: AppUser = {
              id: session.user.id,
              username: displayName,
              role: userRole,
              profileId: session.user.id
            };
            
            const defaultProfile: Profile = {
              id: session.user.id,
              userId: session.user.id,
              displayName: displayName,
              role: userRole
            };
            
            setCurrentUser(user);
            setProfiles([defaultProfile]);
            setSelectedProfile(defaultProfile);
            setIsDemo(false);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setSelectedProfile(null);
          setIsDemo(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const updateAssignment = useCallback((id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    if (activeTimer?.assignmentId === id) {
      stopTimer();
    }
  };

  const getScheduleForStudent = (studentName: string, weekday: number) => {
    return scheduleTemplate.filter(s => s.studentName === studentName && s.weekday === weekday);
  };

  const startTimer = (assignmentId: string, profileId: string) => {
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
      const assignment = assignments.find(a => a.id === activeTimer.assignmentId);
      if (assignment) {
        updateAssignment(assignment.id, {
          timeSpent: assignment.timeSpent + Math.floor(activeTimer.elapsedTime / 60)
        });
      }

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

  const userRole = useMemo(() => {
    if (!currentUser) return 'demo' as const;
    return currentUser.role || 'student' as const;
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    return userRole === 'admin';
  }, [userRole]);

  const isDemoUser = useMemo(() => {
    return currentUser?.id?.includes('demo') ||
           currentUser?.username?.toLowerCase().includes('demo') ||
           (typeof currentUser?.id === 'string' && currentUser.id.startsWith('demo-')) ||
           isDemo;
  }, [currentUser, isDemo]);

  return (
    <AppContext.Provider value={{
      currentUser,
      isDemo,
      userRole,
      isAdmin,
      isDemoUser,
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