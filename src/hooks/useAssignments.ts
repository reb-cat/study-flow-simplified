import { useApp } from '@/context/AppContext';
import { useUnifiedAssignments } from './useUnifiedAssignments';

/**
 * Unified hook that returns demo or real assignments based on user type
 * Uses the same logic for both, just different table names
 */
export function useAssignments(refreshKey?: number) {
  const { currentUser, isDemo } = useApp();

  // Use unified hook with appropriate table based on demo mode
  return useUnifiedAssignments(
    currentUser ? currentUser.id : undefined,
    isDemo,
    refreshKey
  );
}