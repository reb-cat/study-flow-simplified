// Unified assignment type that works for both demo and real data
export interface UnifiedAssignment {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  course_name: string | null;
  due_date: string | null;
  scheduled_date: string | null;
  scheduled_block: number | null;
  completed_at: string | null;
  time_spent: number | null;
  canvas_url: string | null;
  canvas_id: number | null;
  created_at: string;
  updated_at: string;
  priority?: string;
  difficulty?: string;
  needs_reschedule?: boolean;
  cleared_at?: string;
}