import { useSupabaseAssignments } from './useSupabaseAssignments';
import { useDemoAssignments } from './useDemoAssignments';
import { useApp } from '@/context/AppContext';
import { UnifiedAssignment } from '@/types/assignment';

/**
 * Unified hook that returns demo or real assignments based on user type
 */
export function useAssignments() {
  const { currentUser, isDemo } = useApp();
  
  // For demo users, use demo assignments table
  const demoResult = useDemoAssignments(
    isDemo && currentUser ? currentUser.id : undefined
  );
  
  // For real users, use real assignments table  
  const realResult = useSupabaseAssignments(
    !isDemo && currentUser ? currentUser.id : undefined
  );

  // Return appropriate result based on demo mode
  if (isDemo) {
    return {
      assignments: demoResult.assignments.map(a => ({
        ...a,
        canvas_url: null,
        canvas_id: null
      })) as UnifiedAssignment[],
      isLoading: demoResult.isLoading,
      error: demoResult.error,
      refetch: demoResult.refetch,
      updateAssignment: undefined // Demo data is read-only for now
    };
  }

  return {
    assignments: realResult.assignments as UnifiedAssignment[],
    isLoading: realResult.isLoading,
    error: realResult.error,
    refetch: realResult.refetch,
    updateAssignment: realResult.updateAssignment
  };
}