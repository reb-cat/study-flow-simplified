import { useApp } from '@/context/AppContext';
import { useUnifiedAssignments } from './useUnifiedAssignments';
import { getStudentNameFromEmail } from '@/lib/utils';

/**
 * Unified hook that returns demo or real assignments based on user type
 * Uses the same logic for both, just different table names
 */
export function useAssignments(refreshKey?: number) {
  const { currentUser, isDemo, selectedProfile } = useApp();

  // Get the correct student name for database lookup
  const getStudentName = (): string | undefined => {
    if (isDemo || !currentUser) {
      return selectedProfile?.displayName;
    }
    
    // For real users, currentUser.id contains their email
    if (currentUser.id && currentUser.id.includes('@')) {
      return getStudentNameFromEmail(currentUser.id);
    }
    
    return selectedProfile?.displayName;
  };

  // Use unified hook with appropriate student name based on demo mode
  return useUnifiedAssignments(
    getStudentName(),
    isDemo,
    refreshKey
  );
}