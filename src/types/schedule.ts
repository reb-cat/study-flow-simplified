import { ScheduleTemplate, Assignment } from './index';
import { AssignmentFamily } from '@/lib/family-detection';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { SupabaseAssignment } from '@/hooks/useSupabaseAssignments';

export interface PopulatedScheduleBlock extends SupabaseScheduleBlock {
  assignment?: SupabaseAssignment;
  assignedFamily?: AssignmentFamily;
}