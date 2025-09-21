import { useSupabaseAssignments } from './useSupabaseAssignments';
import { useDemoAssignments } from './useDemoAssignments';
import { useApp } from '@/context/AppContext';
import { UnifiedAssignment } from '@/types/assignment';

/**
 * Unified hook that returns demo or real assignments based on user type
 */
export function useAssignments() {
  const { currentUser, isDemo } = useApp();
  
  // For demo users, check both demo table and main table with proper user mapping
  const demoUserId = isDemo && currentUser ? currentUser.id.replace('demo-', '') + '-user' : undefined;
  
  const demoResult = useDemoAssignments(
    isDemo && currentUser ? currentUser.id : undefined
  );
  
  // For real users, use real assignments table  
  const realResult = useSupabaseAssignments(
    isDemo && currentUser ? demoUserId : (!isDemo && currentUser ? currentUser.id : undefined)
  );

  // Return appropriate result based on demo mode
  if (isDemo) {
    console.log('Demo mode - demo table assignments:', demoResult.assignments);
    console.log('Demo mode - real table assignments:', realResult.assignments);
    
    // Combine both demo table and real table assignments
    const demoTableMapped = demoResult.assignments.map(a => ({
      ...a,
      user_id: a.student_name, // Map for compatibility
      canvas_url: null,
      canvas_id: null
    })) as UnifiedAssignment[];
    
    const realTableMapped = (realResult.assignments || []) as UnifiedAssignment[];
    
    const allAssignments = [...demoTableMapped, ...realTableMapped];
    console.log('Demo mode - combined assignments:', allAssignments);
    
    return {
      assignments: allAssignments,
      isLoading: demoResult.isLoading || realResult.isLoading,
      error: demoResult.error || realResult.error,
      refetch: () => {
        demoResult.refetch();
        realResult.refetch();
      },
      updateAssignment: realResult.updateAssignment
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