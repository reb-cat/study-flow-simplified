import { useApp } from '@/context/AppContext';
import { useUnifiedAssignments } from './useUnifiedAssignments';

/**
 * Unified hook that returns demo or real assignments based on user type
 * Uses the same logic for both, just different table names
 */
export function useAssignments(refreshKey?: number) {
  const { selectedProfile, isDemo } = useApp();

  // Use unified hook with selected student's ID (UUID for real users, displayName for demo)
  return useUnifiedAssignments(
    selectedProfile ? selectedProfile.id : undefined,
    isDemo,
    refreshKey
  );
}