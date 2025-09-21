import { useSupabaseAssignments } from './useSupabaseAssignments';
import { useDemoAssignments } from './useDemoAssignments';
import { useApp } from '@/context/AppContext';
import { UnifiedAssignment } from '@/types/assignment';

/**
 * Unified hook that returns demo or real assignments based on user type
 */
export function useAssignments() {
  const { currentUser, isDemo } = useApp();
  
  console.log('🏠 useAssignments - currentUser:', currentUser?.id, 'isDemo:', isDemo);
  
  // For demo users, use demo assignments table
  const demoUserId = isDemo && currentUser ? currentUser.id : undefined;
  const realUserId = !isDemo && currentUser ? currentUser.id : undefined;
  
  console.log('🎭 Demo userId:', demoUserId, '🏢 Real userId:', realUserId);
  
  const demoResult = useDemoAssignments(demoUserId);
  
  // For real users, use real assignments table  
  const realResult = useSupabaseAssignments(realUserId);

  // Return appropriate result based on demo mode
  if (isDemo) {
    const mappedAssignments = demoResult.assignments.map(a => ({
      ...a,
      user_id: a.student_name, // Map for compatibility
      canvas_url: null,
      canvas_id: null
    })) as UnifiedAssignment[];
    
    console.log('🎭 Demo assignments mapped:', mappedAssignments.length, mappedAssignments);
    
    return {
      assignments: mappedAssignments,
      isLoading: demoResult.isLoading,
      error: demoResult.error,
      refetch: demoResult.refetch,
      updateAssignment: undefined // Demo data is read-only for now
    };
  }

  console.log('🏢 Real assignments:', realResult.assignments?.length || 0, realResult.assignments);
  
  return {
    assignments: realResult.assignments as UnifiedAssignment[],
    isLoading: realResult.isLoading,
    error: realResult.error,
    refetch: realResult.refetch,
    updateAssignment: realResult.updateAssignment
  };
}