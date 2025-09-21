import { ScheduleTemplate, Assignment } from './index';
import { AssignmentFamily } from '@/lib/family-detection';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';

export interface PopulatedScheduleBlock extends SupabaseScheduleBlock {
  assignment?: UnifiedAssignment;
  assignedFamily?: AssignmentFamily;
}