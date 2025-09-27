import { supabase } from '@/integrations/supabase/client';

export class CanvasSync {
  private apiToken: string;
  private baseUrl: string;
  private studentId: string;  // The actual UUID
  private instanceName: string;

  constructor(apiToken: string, canvasUrl: string, studentId: string, instanceName: string = 'default') {
    this.apiToken = apiToken;
    this.baseUrl = `${canvasUrl}/api/v1`;
    this.studentId = studentId;  // Will be ab0d7c00... or ba62b80b...
    this.instanceName = instanceName;
  }

  async syncAssignments(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const courses = await this.getActiveCourses();
      let totalSynced = 0;

      for (const course of courses) {
        const assignments = await this.getCourseAssignments(course.id);
        
        for (const assignment of assignments) {
          // Skip assignments without due dates or older than 30 days
          if (!assignment.due_at) continue;
          
          const dueDate = new Date(assignment.due_at);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          if (dueDate < thirtyDaysAgo) continue;

          // Check if assignment already exists for this student and instance
          const { data: existing } = await supabase
            .from('assignments')
            .select('id, completion_status')
            .eq('canvas_id', assignment.id)
            .eq('user_id', this.studentId)
            .eq('canvas_instance', parseInt(this.instanceName) || 1)
            .maybeSingle();

          if (existing) {
            // Update existing but DON'T change completion_status
            await supabase
              .from('assignments')
              .update({
                title: assignment.name,
                due_date: assignment.due_at,
                canvas_url: assignment.html_url,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          } else {
            // Create new assignment
            const { error: insertError } = await supabase
              .from('assignments')
              .insert({
                user_id: this.studentId,
                canvas_id: assignment.id,
                canvas_course_id: course.id,
                canvas_instance: parseInt(this.instanceName) || 1,
                title: assignment.name,
                subject: course.name,
                course_name: course.course_code,
                instructions: assignment.description?.substring(0, 500),
                due_date: assignment.due_at,
                canvas_url: assignment.html_url,
                submission_types: assignment.submission_types || [],
                points_value: assignment.points_possible,
                is_canvas_import: true,
                creation_source: 'canvas',
                completion_status: 'pending'
              } as any);
              
            if (insertError) {
              console.error('Error inserting assignment:', insertError);
            }
          }
          
          totalSynced++;
        }
      }

      return { success: true, count: totalSynced };
    } catch (error) {
      return { success: false, count: 0, error: String(error) };
    }
  }

  private async getActiveCourses() {
    const response = await fetch(`${this.baseUrl}/courses?enrollment_state=active&per_page=100`, {
      headers: { 'Authorization': `Bearer ${this.apiToken}` }
    });
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
  }

  private async getCourseAssignments(courseId: number) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/assignments?per_page=100`, {
      headers: { 'Authorization': `Bearer ${this.apiToken}` }
    });
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
  }
}