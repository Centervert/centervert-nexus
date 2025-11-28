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
      billcom_sync_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["billcom_activity_type"]
          created_at: string | null
          created_by: string | null
          id: string
          message: string
          metadata: Json | null
          organization_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["billcom_activity_type"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          message: string
          metadata?: Json | null
          organization_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["billcom_activity_type"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billcom_sync_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billcom_sync_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string | null
          email: string
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          show_in_all_contacts: boolean
          title: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          show_in_all_contacts?: boolean
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          show_in_all_contacts?: boolean
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_raises: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_salary: number
          effective_date: string
          employee_id: string
          id: string
          new_salary: number
          notes: string | null
          raise_amount: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_salary: number
          effective_date: string
          employee_id: string
          id?: string
          new_salary: number
          notes?: string | null
          raise_amount: number
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_salary?: number
          effective_date?: string
          employee_id?: string
          id?: string
          new_salary?: number
          notes?: string | null
          raise_amount?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_raises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_raises_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          country: string
          created_at: string | null
          created_by: string | null
          email: string
          employment_type: string
          end_date: string | null
          first_name: string
          gusto_employee_id: string | null
          id: string
          is_active: boolean
          last_name: string
          nickname: string | null
          notes: string | null
          phone: string | null
          position: string
          salary_amount: number
          salary_type: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          country?: string
          created_at?: string | null
          created_by?: string | null
          email: string
          employment_type: string
          end_date?: string | null
          first_name: string
          gusto_employee_id?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          position: string
          salary_amount: number
          salary_type: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          country?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          employment_type?: string
          end_date?: string | null
          first_name?: string
          gusto_employee_id?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          position?: string
          salary_amount?: number
          salary_type?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          amount_due: number
          billcom_invoice_id: string | null
          billcom_payment_link: string | null
          billcom_pdf_url: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          line_items: Json | null
          metadata: Json | null
          organization_id: string
          paid_date: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_due: number
          billcom_invoice_id?: string | null
          billcom_payment_link?: string | null
          billcom_pdf_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          line_items?: Json | null
          metadata?: Json | null
          organization_id: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_due?: number
          billcom_invoice_id?: string | null
          billcom_payment_link?: string | null
          billcom_pdf_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          line_items?: Json | null
          metadata?: Json | null
          organization_id?: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          related_opportunity_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          related_opportunity_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          related_opportunity_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          award_date: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_value: number | null
          id: string
          name: string
          opportunity_number: string | null
          owner_id: string | null
          priority: Database["public"]["Enums"]["opportunity_priority"] | null
          requestor_contact_id: string | null
          requestor_organization_id: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          submission_address: string | null
          submission_link: string | null
          submission_location_type:
            | Database["public"]["Enums"]["submission_location_type"]
            | null
          submission_notes: string | null
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string | null
        }
        Insert: {
          award_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_value?: number | null
          id?: string
          name: string
          opportunity_number?: string | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["opportunity_priority"] | null
          requestor_contact_id?: string | null
          requestor_organization_id?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          submission_address?: string | null
          submission_link?: string | null
          submission_location_type?:
            | Database["public"]["Enums"]["submission_location_type"]
            | null
          submission_notes?: string | null
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string | null
        }
        Update: {
          award_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_value?: number | null
          id?: string
          name?: string
          opportunity_number?: string | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["opportunity_priority"] | null
          requestor_contact_id?: string | null
          requestor_organization_id?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          submission_address?: string | null
          submission_link?: string | null
          submission_location_type?:
            | Database["public"]["Enums"]["submission_location_type"]
            | null
          submission_notes?: string | null
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_requestor_contact_id_fkey"
            columns: ["requestor_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_requestor_organization_id_fkey"
            columns: ["requestor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_attachments: {
        Row: {
          attachment_type: string | null
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          opportunity_id: string
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          opportunity_id: string
        }
        Update: {
          attachment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_attachments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_team_members: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          opportunity_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          opportunity_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          opportunity_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_team_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_team_members_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_updates: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          opportunity_id: string
          update_type: Database["public"]["Enums"]["opportunity_update_type"]
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          opportunity_id: string
          update_type?: Database["public"]["Enums"]["opportunity_update_type"]
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          opportunity_id?: string
          update_type?: Database["public"]["Enums"]["opportunity_update_type"]
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_updates_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          billcom_customer_id: string | null
          billing_email: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          organization_type: string | null
          phone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          billcom_customer_id?: string | null
          billing_email?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          organization_type?: string | null
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          billcom_customer_id?: string | null
          billing_email?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          organization_type?: string | null
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          billcom_payment_id: string | null
          created_at: string | null
          id: string
          invoice_id: string
          metadata: Json | null
          payment_date: string
          payment_method: string | null
          status: string | null
        }
        Insert: {
          amount: number
          billcom_payment_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          payment_date: string
          payment_method?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          billcom_payment_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          payment_date?: string
          payment_method?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          notification_preferences: Json | null
          organization_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_invoice_templates: {
        Row: {
          amount: number
          billcom_recurring_id: string | null
          created_at: string | null
          description: string | null
          frequency: Database["public"]["Enums"]["invoice_frequency"]
          id: string
          is_active: boolean | null
          line_items: Json | null
          name: string
          next_invoice_date: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          billcom_recurring_id?: string | null
          created_at?: string | null
          description?: string | null
          frequency: Database["public"]["Enums"]["invoice_frequency"]
          id?: string
          is_active?: boolean | null
          line_items?: Json | null
          name: string
          next_invoice_date?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billcom_recurring_id?: string | null
          created_at?: string | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["invoice_frequency"]
          id?: string
          is_active?: boolean | null
          line_items?: Json | null
          name?: string
          next_invoice_date?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoice_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_orphaned_profiles: {
        Args: never
        Returns: {
          deleted_email: string
          deleted_profile_id: string
        }[]
      }
      create_billcom_sync_log: {
        Args: {
          p_activity_type: Database["public"]["Enums"]["billcom_activity_type"]
          p_created_by?: string
          p_message: string
          p_metadata?: Json
          p_organization_id: string
        }
        Returns: string
      }
      extract_mentioned_users: { Args: { content: string }; Returns: string[] }
      get_available_agents: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      get_users_with_roles: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          roles: string[]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "user"
      billcom_activity_type:
        | "customer_linked"
        | "customer_auto_linked"
        | "invoice_synced"
        | "sync_completed"
        | "sync_failed"
        | "manual_link"
      invoice_frequency: "weekly" | "monthly" | "quarterly" | "annually"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "partial"
        | "paid"
        | "overdue"
        | "void"
      opportunity_priority: "low" | "medium" | "high" | "critical"
      opportunity_status:
        | "new"
        | "in_talks"
        | "working_on_proposal"
        | "proposal_submitted"
        | "approved"
        | "declined"
        | "see_activity"
      opportunity_type: "private" | "government"
      opportunity_update_type:
        | "manual"
        | "status_change"
        | "assignment_change"
        | "resource_added"
      submission_location_type: "in_person" | "online" | "other"
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
    Enums: {
      app_role: ["admin", "agent", "user"],
      billcom_activity_type: [
        "customer_linked",
        "customer_auto_linked",
        "invoice_synced",
        "sync_completed",
        "sync_failed",
        "manual_link",
      ],
      invoice_frequency: ["weekly", "monthly", "quarterly", "annually"],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "partial",
        "paid",
        "overdue",
        "void",
      ],
      opportunity_priority: ["low", "medium", "high", "critical"],
      opportunity_status: [
        "new",
        "in_talks",
        "working_on_proposal",
        "proposal_submitted",
        "approved",
        "declined",
        "see_activity",
      ],
      opportunity_type: ["private", "government"],
      opportunity_update_type: [
        "manual",
        "status_change",
        "assignment_change",
        "resource_added",
      ],
      submission_location_type: ["in_person", "online", "other"],
    },
  },
} as const
