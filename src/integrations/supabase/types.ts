export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      __migrations: {
        Row: {
          applied_at: string | null
          checksum: string
          description: string
          id: string
        }
        Insert: {
          applied_at?: string | null
          checksum: string
          description: string
          id: string
        }
        Update: {
          applied_at?: string | null
          checksum?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          academic_year: string | null
          actual_estimated_minutes: number | null
          available_from: string | null
          available_until: string | null
          block_end: string | null
          block_start: string | null
          block_type: string | null
          canvas_category: string | null
          canvas_course_id: number | null
          canvas_grade_status: string | null
          canvas_id: number | null
          canvas_instance: number | null
          canvas_module_item_id: number | null
          canvas_page_slug: string | null
          canvas_url: string | null
          completed_at: string | null
          completion_status: string | null
          confidence_score: string | null
          course_name: string | null
          created_at: string | null
          creation_source: string | null
          deleted_at: string | null
          detected_family: string | null
          difficulty: string | null
          due_date: string | null
          grading_delay_detected_at: string | null
          id: string
          instructions: string | null
          interactive_type: string | null
          is_assignment_block: boolean | null
          is_canvas_import: boolean | null
          is_portable: boolean | null
          is_recurring: boolean | null
          module_number: number | null
          needs_manual_due_date: boolean | null
          needs_printing: boolean | null
          notes: string | null
          parent_id: string | null
          parent_notes: string | null
          points_value: number | null
          portability_reason: string | null
          print_reason: string | null
          print_status: string | null
          printed_at: string | null
          priority: string | null
          reading_number: number | null
          requires_printing: boolean | null
          scheduled_block: number | null
          scheduled_date: string | null
          segment_order: number | null
          speechify_url: string | null
          subject: string | null
          submission_types: string[] | null
          suggested_due_date: string | null
          time_spent: number | null
          title: string
          updated_at: string | null
          user_id: string
          worksheet_questions: Json | null
        }
        Insert: {
          academic_year?: string | null
          actual_estimated_minutes?: number | null
          available_from?: string | null
          available_until?: string | null
          block_end?: string | null
          block_start?: string | null
          block_type?: string | null
          canvas_category?: string | null
          canvas_course_id?: number | null
          canvas_grade_status?: string | null
          canvas_id?: number | null
          canvas_instance?: number | null
          canvas_module_item_id?: number | null
          canvas_page_slug?: string | null
          canvas_url?: string | null
          completed_at?: string | null
          completion_status?: string | null
          confidence_score?: string | null
          course_name?: string | null
          created_at?: string | null
          creation_source?: string | null
          deleted_at?: string | null
          detected_family?: string | null
          difficulty?: string | null
          due_date?: string | null
          grading_delay_detected_at?: string | null
          id?: string
          instructions?: string | null
          interactive_type?: string | null
          is_assignment_block?: boolean | null
          is_canvas_import?: boolean | null
          is_portable?: boolean | null
          is_recurring?: boolean | null
          module_number?: number | null
          needs_manual_due_date?: boolean | null
          needs_printing?: boolean | null
          notes?: string | null
          parent_id?: string | null
          parent_notes?: string | null
          points_value?: number | null
          portability_reason?: string | null
          print_reason?: string | null
          print_status?: string | null
          printed_at?: string | null
          priority?: string | null
          reading_number?: number | null
          requires_printing?: boolean | null
          scheduled_block?: number | null
          scheduled_date?: string | null
          segment_order?: number | null
          speechify_url?: string | null
          subject?: string | null
          submission_types?: string[] | null
          suggested_due_date?: string | null
          time_spent?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          worksheet_questions?: Json | null
        }
        Update: {
          academic_year?: string | null
          actual_estimated_minutes?: number | null
          available_from?: string | null
          available_until?: string | null
          block_end?: string | null
          block_start?: string | null
          block_type?: string | null
          canvas_category?: string | null
          canvas_course_id?: number | null
          canvas_grade_status?: string | null
          canvas_id?: number | null
          canvas_instance?: number | null
          canvas_module_item_id?: number | null
          canvas_page_slug?: string | null
          canvas_url?: string | null
          completed_at?: string | null
          completion_status?: string | null
          confidence_score?: string | null
          course_name?: string | null
          created_at?: string | null
          creation_source?: string | null
          deleted_at?: string | null
          detected_family?: string | null
          difficulty?: string | null
          due_date?: string | null
          grading_delay_detected_at?: string | null
          id?: string
          instructions?: string | null
          interactive_type?: string | null
          is_assignment_block?: boolean | null
          is_canvas_import?: boolean | null
          is_portable?: boolean | null
          is_recurring?: boolean | null
          module_number?: number | null
          needs_manual_due_date?: boolean | null
          needs_printing?: boolean | null
          notes?: string | null
          parent_id?: string | null
          parent_notes?: string | null
          points_value?: number | null
          portability_reason?: string | null
          print_reason?: string | null
          print_status?: string | null
          printed_at?: string | null
          priority?: string | null
          reading_number?: number | null
          requires_printing?: boolean | null
          scheduled_block?: number | null
          scheduled_date?: string | null
          segment_order?: number | null
          speechify_url?: string | null
          subject?: string | null
          submission_types?: string[] | null
          suggested_due_date?: string | null
          time_spent?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          worksheet_questions?: Json | null
        }
        Relationships: []
      }
      bible_curriculum: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          day_of_week: number | null
          id: string
          reading_title: string | null
          reading_type: string | null
          week_number: number
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          day_of_week?: number | null
          id?: string
          reading_title?: string | null
          reading_type?: string | null
          week_number: number
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          day_of_week?: number | null
          id?: string
          reading_title?: string | null
          reading_type?: string | null
          week_number?: number
        }
        Relationships: []
      }
      bible_curriculum_position: {
        Row: {
          current_day: number
          current_week: number
          id: number
          last_updated: string | null
          student_name: string
        }
        Insert: {
          current_day?: number
          current_week?: number
          id?: number
          last_updated?: string | null
          student_name: string
        }
        Update: {
          current_day?: number
          current_week?: number
          id?: number
          last_updated?: string | null
          student_name?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          category: string
          created_at: string | null
          id: number
          is_active: boolean | null
          item_name: string
          sort_order: number | null
          student_name: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          item_name: string
          sort_order?: number | null
          student_name: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          item_name?: string
          sort_order?: number | null
          student_name?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_schedule_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_assignment_id: string | null
          date: string
          flags: Json | null
          id: string
          started_at: string | null
          status: string
          student_name: string
          template_block_id: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_assignment_id?: string | null
          date: string
          flags?: Json | null
          id?: string
          started_at?: string | null
          status?: string
          student_name: string
          template_block_id: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_assignment_id?: string | null
          date?: string
          flags?: Json | null
          id?: string
          started_at?: string | null
          status?: string
          student_name?: string
          template_block_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      demo_assignments: {
        Row: {
          completed_at: string | null
          course_name: string | null
          created_at: string | null
          difficulty: string | null
          due_date: string | null
          id: string
          priority: string | null
          scheduled_block: number | null
          scheduled_date: string | null
          student_name: string
          subject: string | null
          time_spent: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          course_name?: string | null
          created_at?: string | null
          difficulty?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          scheduled_block?: number | null
          scheduled_date?: string | null
          student_name: string
          subject?: string | null
          time_spent?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          course_name?: string | null
          created_at?: string | null
          difficulty?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          scheduled_block?: number | null
          scheduled_date?: string | null
          student_name?: string
          subject?: string | null
          time_spent?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      earn_events: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          source_details: string | null
          source_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          source_details?: string | null
          source_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          source_details?: string | null
          source_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_sessions: {
        Row: {
          assignment_id: string | null
          completed_at: string | null
          created_at: string | null
          difficulty: string | null
          id: string
          needs_help: boolean | null
          notes: string | null
          session_type: string | null
          started_at: string | null
          student_name: string | null
          time_spent: number | null
        }
        Insert: {
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          needs_help?: boolean | null
          notes?: string | null
          session_type?: string | null
          started_at?: string | null
          student_name?: string | null
          time_spent?: number | null
        }
        Update: {
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          needs_help?: boolean | null
          notes?: string | null
          session_type?: string | null
          started_at?: string | null
          student_name?: string | null
          time_spent?: number | null
        }
        Relationships: []
      }
      quests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_progress: number
          description: string | null
          expires_at: string | null
          goal_type: string | null
          goaltype: string | null
          id: string
          is_completed: boolean
          reward_points: number
          target: number | null
          target_value: number
          title: string
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number
          description?: string | null
          expires_at?: string | null
          goal_type?: string | null
          goaltype?: string | null
          id?: string
          is_completed?: boolean
          reward_points: number
          target?: number | null
          target_value?: number
          title: string
          type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number
          description?: string | null
          expires_at?: string | null
          goal_type?: string | null
          goaltype?: string | null
          id?: string
          is_completed?: boolean
          reward_points?: number
          target?: number | null
          target_value?: number
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      redemption_requests: {
        Row: {
          catalog_item_id: string
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          id: string
          parent_notes: string | null
          points_spent: number
          requested_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          parent_notes?: string | null
          points_spent: number
          requested_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          parent_notes?: string | null
          points_spent?: number
          requested_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_catalog: {
        Row: {
          category: string | null
          cost_points: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          notes: string | null
          owner_id: string
          times_redeemed: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cost_points: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          owner_id: string
          times_redeemed?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cost_points?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          owner_id?: string
          times_redeemed?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reward_profiles: {
        Row: {
          created_at: string | null
          id: string
          last_streak_date: string | null
          lastclaimeddate: string | null
          level: number
          lifetime_points: number
          points: number
          streak_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_streak_date?: string | null
          lastclaimeddate?: string | null
          level?: number
          lifetime_points?: number
          points?: number
          streak_days?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_streak_date?: string | null
          lastclaimeddate?: string | null
          level?: number
          lifetime_points?: number
          points?: number
          streak_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reward_settings: {
        Row: {
          created_at: string | null
          daily_earn_cap_points: number
          id: string
          redemption_cooldown_minutes: number
          session_minimum_minutes: number
          session_pause_threshold: number
          updated_at: string | null
          user_id: string
          weekly_earn_cap_points: number
        }
        Insert: {
          created_at?: string | null
          daily_earn_cap_points?: number
          id?: string
          redemption_cooldown_minutes?: number
          session_minimum_minutes?: number
          session_pause_threshold?: number
          updated_at?: string | null
          user_id: string
          weekly_earn_cap_points?: number
        }
        Update: {
          created_at?: string | null
          daily_earn_cap_points?: number
          id?: string
          redemption_cooldown_minutes?: number
          session_minimum_minutes?: number
          session_pause_threshold?: number
          updated_at?: string | null
          user_id?: string
          weekly_earn_cap_points?: number
        }
        Relationships: []
      }
      schedule_template: {
        Row: {
          block_name: string | null
          block_number: number | null
          block_type: string
          end_time: string
          id: string
          start_time: string
          student_name: string
          subject: string
          weekday: string
        }
        Insert: {
          block_name?: string | null
          block_number?: number | null
          block_type: string
          end_time: string
          id?: string
          start_time: string
          student_name: string
          subject: string
          weekday: string
        }
        Update: {
          block_name?: string | null
          block_number?: number | null
          block_type?: string
          end_time?: string
          id?: string
          start_time?: string
          student_name?: string
          subject?: string
          weekday?: string
        }
        Relationships: []
      }
      seed_status: {
        Row: {
          applied_at: string | null
          checksum: string
          id: string
          rows_inserted: number | null
          rows_skipped: number | null
          seed_name: string
          seed_version: string
        }
        Insert: {
          applied_at?: string | null
          checksum: string
          id?: string
          rows_inserted?: number | null
          rows_skipped?: number | null
          seed_name: string
          seed_version?: string
        }
        Update: {
          applied_at?: string | null
          checksum?: string
          id?: string
          rows_inserted?: number | null
          rows_skipped?: number | null
          seed_name?: string
          seed_version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          expire: string
          sess: Json
          sid: string
        }
        Insert: {
          expire: string
          sess: Json
          sid: string
        }
        Update: {
          expire?: string
          sess?: Json
          sid?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          allow_saturday_scheduling: boolean | null
          created_at: string | null
          display_name: string | null
          id: string
          profile_image_url: string | null
          student_name: string
          theme_color: string | null
          updated_at: string | null
        }
        Insert: {
          allow_saturday_scheduling?: boolean | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          profile_image_url?: string | null
          student_name: string
          theme_color?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_saturday_scheduling?: boolean | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          profile_image_url?: string | null
          student_name?: string
          theme_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_scheduling_profiles: {
        Row: {
          created_at: string | null
          global_multiplier: number | null
          has_adhd: boolean | null
          has_dyslexia: boolean | null
          has_executive_function_challenges: boolean | null
          id: string
          max_focus_minutes_per_day: number | null
          max_per_course_per_day: number | null
          problems_min: number | null
          profile_notes: string | null
          read_min_per_page: number | null
          reading_multiplier: number | null
          student_name: string
          updated_at: string | null
          write_min_per_100_words: number | null
          writing_multiplier: number | null
        }
        Insert: {
          created_at?: string | null
          global_multiplier?: number | null
          has_adhd?: boolean | null
          has_dyslexia?: boolean | null
          has_executive_function_challenges?: boolean | null
          id?: string
          max_focus_minutes_per_day?: number | null
          max_per_course_per_day?: number | null
          problems_min?: number | null
          profile_notes?: string | null
          read_min_per_page?: number | null
          reading_multiplier?: number | null
          student_name: string
          updated_at?: string | null
          write_min_per_100_words?: number | null
          writing_multiplier?: number | null
        }
        Update: {
          created_at?: string | null
          global_multiplier?: number | null
          has_adhd?: boolean | null
          has_dyslexia?: boolean | null
          has_executive_function_challenges?: boolean | null
          id?: string
          max_focus_minutes_per_day?: number | null
          max_per_course_per_day?: number | null
          problems_min?: number | null
          profile_notes?: string | null
          read_min_per_page?: number | null
          reading_multiplier?: number | null
          student_name?: string
          updated_at?: string | null
          write_min_per_100_words?: number | null
          writing_multiplier?: number | null
        }
        Relationships: []
      }
      student_status: {
        Row: {
          completed_today: number | null
          current_assignment_id: string | null
          current_assignment_title: string | null
          current_mode: string | null
          estimated_end_time: string | null
          id: string
          is_overtime_on_task: boolean | null
          is_stuck: boolean | null
          last_activity: string | null
          minutes_worked_today: number | null
          needs_help: boolean | null
          session_start_time: string | null
          stuck_since: string | null
          student_name: string
          target_minutes_today: number | null
          total_today: number | null
          updated_at: string | null
        }
        Insert: {
          completed_today?: number | null
          current_assignment_id?: string | null
          current_assignment_title?: string | null
          current_mode?: string | null
          estimated_end_time?: string | null
          id?: string
          is_overtime_on_task?: boolean | null
          is_stuck?: boolean | null
          last_activity?: string | null
          minutes_worked_today?: number | null
          needs_help?: boolean | null
          session_start_time?: string | null
          stuck_since?: string | null
          student_name: string
          target_minutes_today?: number | null
          total_today?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_today?: number | null
          current_assignment_id?: string | null
          current_assignment_title?: string | null
          current_mode?: string | null
          estimated_end_time?: string | null
          id?: string
          is_overtime_on_task?: boolean | null
          is_stuck?: boolean | null
          last_activity?: string | null
          minutes_worked_today?: number | null
          needs_help?: boolean | null
          session_start_time?: string | null
          stuck_since?: string | null
          student_name?: string
          target_minutes_today?: number | null
          total_today?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      worksheet_answers: {
        Row: {
          answers: Json | null
          assignment_id: string | null
          completed_at: string | null
          created_at: string | null
          exported: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          exported?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          assignment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          exported?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worksheet_answers_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
