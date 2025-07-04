export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          household_members: number | null
          id: string
          income_range: string | null
          last_name: string | null
          phone_number: string | null
          updated_at: string
          year_of_birth: number | null
          zip_code: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          household_members?: number | null
          id: string
          income_range?: string | null
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
          year_of_birth?: number | null
          zip_code?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          household_members?: number | null
          id?: string
          income_range?: string | null
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
          year_of_birth?: number | null
          zip_code?: string | null
        }
        Relationships: []
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
