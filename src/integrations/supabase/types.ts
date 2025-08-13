export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bulk_offers: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          failed_sends: number
          id: string
          institution_id: string
          scheduled_for: string | null
          status: string
          successful_sends: number
          targeting_filters: Json | null
          template_id: string | null
          title: string
          total_recipients: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          failed_sends?: number
          id?: string
          institution_id: string
          scheduled_for?: string | null
          status?: string
          successful_sends?: number
          targeting_filters?: Json | null
          template_id?: string | null
          title: string
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          failed_sends?: number
          id?: string
          institution_id?: string
          scheduled_for?: string | null
          status?: string
          successful_sends?: number
          targeting_filters?: Json | null
          template_id?: string | null
          title?: string
          total_recipients?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_tasks: {
        Row: {
          actual_savings: number | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_savings: number | null
          id: string
          recurrence_pattern: string | null
          status: string
          suggestion_id: string | null
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_savings?: number | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_savings?: number | null
          id?: string
          recurrence_pattern?: string | null
          status?: string
          suggestion_id?: string | null
          task_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_savings?: number | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_savings?: number | null
          id?: string
          recurrence_pattern?: string | null
          status?: string
          suggestion_id?: string | null
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          created_at: string
          current_employer: string | null
          current_financial_institution: string | null
          current_or_former_military: string | null
          diversity_equity_inclusion: boolean | null
          email: string | null
          environmental_initiatives: boolean | null
          id: string
          looking_for: string | null
          military_branch: string | null
          religion: string | null
          religious_organization: string | null
          sharia_compliant: boolean | null
          student_or_alumni: string | null
          submission_ip: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_employer?: string | null
          current_financial_institution?: string | null
          current_or_former_military?: string | null
          diversity_equity_inclusion?: boolean | null
          email?: string | null
          environmental_initiatives?: boolean | null
          id?: string
          looking_for?: string | null
          military_branch?: string | null
          religion?: string | null
          religious_organization?: string | null
          sharia_compliant?: boolean | null
          student_or_alumni?: string | null
          submission_ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_employer?: string | null
          current_financial_institution?: string | null
          current_or_former_military?: string | null
          diversity_equity_inclusion?: boolean | null
          email?: string | null
          environmental_initiatives?: boolean | null
          id?: string
          looking_for?: string | null
          military_branch?: string | null
          religion?: string | null
          religious_organization?: string | null
          sharia_compliant?: boolean | null
          student_or_alumni?: string | null
          submission_ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      institution_offers: {
        Row: {
          bulk_offer_id: string | null
          created_at: string
          description: string | null
          expiry_date: string | null
          id: string
          institution_id: string
          offer_link: string | null
          referral_bonus: number | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bulk_offer_id?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          institution_id: string
          offer_link?: string | null
          referral_bonus?: number | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bulk_offer_id?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          institution_id?: string
          offer_link?: string | null
          referral_bonus?: number | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_offers_bulk_offer_id_fkey"
            columns: ["bulk_offer_id"]
            isOneToOne: false
            referencedRelation: "bulk_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_offers_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_offers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "offer_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_new_offers: boolean | null
          email_template_approvals: boolean | null
          email_template_updates: boolean | null
          id: string
          in_app_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_new_offers?: boolean | null
          email_template_approvals?: boolean | null
          email_template_updates?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_new_offers?: boolean | null
          email_template_approvals?: boolean | null
          email_template_updates?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_templates: {
        Row: {
          allowed_filters: Json | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          description: string | null
          eligibility_criteria: string | null
          expiry_date: string | null
          id: string
          is_published: boolean | null
          name: string
          offer_link: string | null
          publish_at: string | null
          rejection_reason: string | null
          reward_details: string | null
          type: string
          updated_at: string
        }
        Insert: {
          allowed_filters?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          eligibility_criteria?: string | null
          expiry_date?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          offer_link?: string | null
          publish_at?: string | null
          rejection_reason?: string | null
          reward_details?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          allowed_filters?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          eligibility_criteria?: string | null
          expiry_date?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          offer_link?: string | null
          publish_at?: string | null
          rejection_reason?: string | null
          reward_details?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dei_preference: boolean | null
          email: string | null
          first_name: string | null
          full_name: string | null
          green_banking_interest: boolean | null
          household_members: number | null
          id: string
          income_range: string | null
          institution_name: string | null
          institution_type: string | null
          is_student: boolean | null
          last_name: string | null
          location: string | null
          phone_number: string | null
          role: string | null
          updated_at: string
          year_of_birth: number | null
          zip_code: string | null
        }
        Insert: {
          created_at?: string
          dei_preference?: boolean | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          green_banking_interest?: boolean | null
          household_members?: number | null
          id: string
          income_range?: string | null
          institution_name?: string | null
          institution_type?: string | null
          is_student?: boolean | null
          last_name?: string | null
          location?: string | null
          phone_number?: string | null
          role?: string | null
          updated_at?: string
          year_of_birth?: number | null
          zip_code?: string | null
        }
        Update: {
          created_at?: string
          dei_preference?: boolean | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          green_banking_interest?: boolean | null
          household_members?: number | null
          id?: string
          income_range?: string | null
          institution_name?: string | null
          institution_type?: string | null
          is_student?: boolean | null
          last_name?: string | null
          location?: string | null
          phone_number?: string | null
          role?: string | null
          updated_at?: string
          year_of_birth?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      spending_analysis: {
        Row: {
          analysis_date: string
          created_at: string
          frequency_patterns: Json
          id: string
          insights: Json
          monthly_averages: Json
          spending_by_category: Json
          total_spending: number
          total_transactions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_date?: string
          created_at?: string
          frequency_patterns?: Json
          id?: string
          insights?: Json
          monthly_averages?: Json
          spending_by_category?: Json
          total_spending?: number
          total_transactions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_date?: string
          created_at?: string
          frequency_patterns?: Json
          id?: string
          insights?: Json
          monthly_averages?: Json
          spending_by_category?: Json
          total_spending?: number
          total_transactions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spending_suggestions: {
        Row: {
          analysis_id: string
          category: string
          created_at: string
          current_frequency: string | null
          description: string
          id: string
          potential_savings: number | null
          priority_score: number
          status: string
          suggested_frequency: string | null
          suggestion_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          category: string
          created_at?: string
          current_frequency?: string | null
          description: string
          id?: string
          potential_savings?: number | null
          priority_score?: number
          status?: string
          suggested_frequency?: string | null
          suggestion_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          category?: string
          created_at?: string
          current_frequency?: string | null
          description?: string
          id?: string
          potential_savings?: number | null
          priority_score?: number
          status?: string
          suggested_frequency?: string | null
          suggestion_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_suggestions_analysis"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "spending_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      task_calendar_events: {
        Row: {
          created_at: string
          end_date: string | null
          event_description: string | null
          event_title: string
          ics_data: string | null
          id: string
          is_recurring: boolean
          start_date: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          event_description?: string | null
          event_title: string
          ics_data?: string | null
          id?: string
          is_recurring?: boolean
          start_date: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          event_description?: string | null
          event_title?: string
          ics_data?: string | null
          id?: string
          is_recurring?: boolean
          start_date?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_events_task"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "financial_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      template_publishing_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          published_at: string | null
          scheduled_for: string | null
          staff_user_id: string | null
          template_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          published_at?: string | null
          scheduled_for?: string | null
          staff_user_id?: string | null
          template_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          published_at?: string | null
          scheduled_for?: string | null
          staff_user_id?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_publishing_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "offer_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage_logs: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          metadata: Json | null
          template_id: string
          usage_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          metadata?: Json | null
          template_id: string
          usage_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          metadata?: Json | null
          template_id?: string
          usage_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "offer_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_profile_with_preferences: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          email: string
          created_at: string
          updated_at: string
          has_preferences: boolean
          preferences_count: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
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
