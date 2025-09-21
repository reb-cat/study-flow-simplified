import { ScheduleTemplate, Assignment } from './index';
import { AssignmentFamily } from '@/lib/family-detection';

export interface PopulatedScheduleBlock extends ScheduleTemplate {
  assignment?: Assignment;
  assignedFamily?: AssignmentFamily;
}