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
      attachments: {
        Row: {
          comment_id: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          ticket_id: string | null
          uploaded_by: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          ticket_id?: string | null
          uploaded_by: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          ticket_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_billing: boolean | null
          is_primary: boolean | null
          is_technical: boolean | null
          notes: string | null
          phone: string | null
          phone_extension: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_billing?: boolean | null
          is_primary?: boolean | null
          is_technical?: boolean | null
          notes?: string | null
          phone?: string | null
          phone_extension?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_billing?: boolean | null
          is_primary?: boolean | null
          is_technical?: boolean | null
          notes?: string | null
          phone?: string | null
          phone_extension?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          access_level: Database["public"]["Enums"]["client_access_level"]
          can_approve_quotes: boolean | null
          can_create_tickets: boolean | null
          can_view_invoices: boolean | null
          client_id: string
          created_at: string | null
          id: string
          invited_by: string | null
          user_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["client_access_level"]
          can_approve_quotes?: boolean | null
          can_create_tickets?: boolean | null
          can_view_invoices?: boolean | null
          client_id: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["client_access_level"]
          can_approve_quotes?: boolean | null
          can_create_tickets?: boolean | null
          can_view_invoices?: boolean | null
          client_id?: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_address: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          created_at: string | null
          default_payment_method: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          managing_agency_id: string | null
          name: string
          notes: string | null
          offline_payment_instructions: string | null
          payment_terms: string | null
          payment_terms_days: number | null
          phone: string | null
          po_system_enabled: boolean | null
          shipping_address: string | null
          stripe_customer_id: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          billing_address?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          created_at?: string | null
          default_payment_method?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          managing_agency_id?: string | null
          name: string
          notes?: string | null
          offline_payment_instructions?: string | null
          payment_terms?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          po_system_enabled?: boolean | null
          shipping_address?: string | null
          stripe_customer_id?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          billing_address?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          created_at?: string | null
          default_payment_method?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          managing_agency_id?: string | null
          name?: string
          notes?: string | null
          offline_payment_instructions?: string | null
          payment_terms?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          po_system_enabled?: boolean | null
          shipping_address?: string | null
          stripe_customer_id?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_managing_agency_id_fkey"
            columns: ["managing_agency_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean
          ticket_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean
          ticket_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean
          ticket_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_type: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          organization: string | null
          phone: string | null
          phone_extension: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          contact_type?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          phone_extension?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_type?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          phone_extension?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dev_builds: {
        Row: {
          branch: string | null
          build_log_url: string | null
          build_number: number
          commit_hash: string | null
          created_at: string | null
          deployed_at: string | null
          deployed_by: string | null
          environment: Database["public"]["Enums"]["dev_build_environment"]
          id: string
          project_id: string
          release_notes: string | null
          status: Database["public"]["Enums"]["dev_build_status"]
          version: string
        }
        Insert: {
          branch?: string | null
          build_log_url?: string | null
          build_number: number
          commit_hash?: string | null
          created_at?: string | null
          deployed_at?: string | null
          deployed_by?: string | null
          environment: Database["public"]["Enums"]["dev_build_environment"]
          id?: string
          project_id: string
          release_notes?: string | null
          status?: Database["public"]["Enums"]["dev_build_status"]
          version: string
        }
        Update: {
          branch?: string | null
          build_log_url?: string | null
          build_number?: number
          commit_hash?: string | null
          created_at?: string | null
          deployed_at?: string | null
          deployed_by?: string | null
          environment?: Database["public"]["Enums"]["dev_build_environment"]
          id?: string
          project_id?: string
          release_notes?: string | null
          status?: Database["public"]["Enums"]["dev_build_status"]
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_builds_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_builds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_project_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          project_id: string
          task_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          task_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          task_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_project_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "dev_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_projects: {
        Row: {
          actual_hours: number | null
          actual_launch_date: string | null
          budget: number | null
          client_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          estimated_hours: number | null
          id: string
          lead_developer_id: string | null
          name: string
          platform: string[] | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          production_url: string | null
          project_manager_id: string | null
          project_number: number
          project_type: Database["public"]["Enums"]["dev_project_type"]
          repository_url: string | null
          staging_url: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["dev_project_status"]
          target_launch_date: string | null
          team_members: string[] | null
          tech_stack: Json | null
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          actual_launch_date?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          lead_developer_id?: string | null
          name: string
          platform?: string[] | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          production_url?: string | null
          project_manager_id?: string | null
          project_number?: number
          project_type: Database["public"]["Enums"]["dev_project_type"]
          repository_url?: string | null
          staging_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["dev_project_status"]
          target_launch_date?: string | null
          team_members?: string[] | null
          tech_stack?: Json | null
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          actual_launch_date?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          lead_developer_id?: string | null
          name?: string
          platform?: string[] | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          production_url?: string | null
          project_manager_id?: string | null
          project_number?: number
          project_type?: Database["public"]["Enums"]["dev_project_type"]
          repository_url?: string | null
          staging_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["dev_project_status"]
          target_launch_date?: string | null
          team_members?: string[] | null
          tech_stack?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_projects_lead_developer_id_fkey"
            columns: ["lead_developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_sprints: {
        Row: {
          completed_points: number | null
          created_at: string | null
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string
          sprint_number: number
          start_date: string
          status: Database["public"]["Enums"]["dev_sprint_status"]
          updated_at: string | null
          velocity_points: number | null
        }
        Insert: {
          completed_points?: number | null
          created_at?: string | null
          end_date: string
          goal?: string | null
          id?: string
          name: string
          project_id: string
          sprint_number: number
          start_date: string
          status?: Database["public"]["Enums"]["dev_sprint_status"]
          updated_at?: string | null
          velocity_points?: number | null
        }
        Update: {
          completed_points?: number | null
          created_at?: string | null
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          sprint_number?: number
          start_date?: string
          status?: Database["public"]["Enums"]["dev_sprint_status"]
          updated_at?: string | null
          velocity_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_task_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          mentions: string[] | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "dev_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_task_time_logs: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          hours: number
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          description?: string | null
          hours: number
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          hours?: number
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_task_time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "dev_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_task_time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_tasks: {
        Row: {
          acceptance_criteria: Json | null
          actual_hours: number | null
          assigned_to: string | null
          blocked_reason: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string
          reviewer_id: string | null
          sprint_id: string | null
          status: Database["public"]["Enums"]["dev_task_status"]
          story_points: number | null
          task_number: number
          task_type: Database["public"]["Enums"]["dev_task_type"]
          title: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: Json | null
          actual_hours?: number | null
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id: string
          reviewer_id?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["dev_task_status"]
          story_points?: number | null
          task_number?: number
          task_type?: Database["public"]["Enums"]["dev_task_type"]
          title: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: Json | null
          actual_hours?: number | null
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string
          reviewer_id?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["dev_task_status"]
          story_points?: number | null
          task_number?: number
          task_type?: Database["public"]["Enums"]["dev_task_type"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "dev_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_tasks_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "dev_sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_services: {
        Row: {
          billing_interval: string | null
          billing_start_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          created_at: string | null
          deliverables: string[] | null
          description: string | null
          id: string
          last_payment_amount: number | null
          last_payment_date: string | null
          monthly_amount: number
          next_billing_date: string
          notes: string | null
          original_ticket_id: string | null
          service_name: string
          service_type: string
          status: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_interval?: string | null
          billing_start_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          created_at?: string | null
          deliverables?: string[] | null
          description?: string | null
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          monthly_amount: number
          next_billing_date: string
          notes?: string | null
          original_ticket_id?: string | null
          service_name: string
          service_type: string
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string | null
          billing_start_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          created_at?: string | null
          deliverables?: string[] | null
          description?: string | null
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          monthly_amount?: number
          next_billing_date?: string
          notes?: string | null
          original_ticket_id?: string | null
          service_name?: string
          service_type?: string
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "managed_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "managed_services_original_ticket_id_fkey"
            columns: ["original_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          assigned_to: string | null
          award_date: string | null
          conference_date: string | null
          conference_link: string | null
          conference_location: string | null
          conference_type: string | null
          created_at: string | null
          created_by: string
          description: string | null
          estimated_value: number | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          notes: string | null
          opportunity_number: string
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          priority: Database["public"]["Enums"]["opportunity_priority"]
          procurement_officer_email: string | null
          procurement_officer_name: string | null
          procurement_officer_phone: string | null
          questions_deadline: string | null
          rfp_number: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          submission_address: string | null
          submission_deadline: string | null
          submission_url: string | null
          submitted_at: string | null
          submitted_by: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          award_date?: string | null
          conference_date?: string | null
          conference_link?: string | null
          conference_location?: string | null
          conference_type?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          notes?: string | null
          opportunity_number: string
          opportunity_type?: Database["public"]["Enums"]["opportunity_type"]
          priority?: Database["public"]["Enums"]["opportunity_priority"]
          procurement_officer_email?: string | null
          procurement_officer_name?: string | null
          procurement_officer_phone?: string | null
          questions_deadline?: string | null
          rfp_number?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          submission_address?: string | null
          submission_deadline?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          award_date?: string | null
          conference_date?: string | null
          conference_link?: string | null
          conference_location?: string | null
          conference_type?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          notes?: string | null
          opportunity_number?: string
          opportunity_type?: Database["public"]["Enums"]["opportunity_type"]
          priority?: Database["public"]["Enums"]["opportunity_priority"]
          procurement_officer_email?: string | null
          procurement_officer_name?: string | null
          procurement_officer_phone?: string | null
          questions_deadline?: string | null
          rfp_number?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          submission_address?: string | null
          submission_deadline?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_attachments: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          opportunity_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          document_type?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          opportunity_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          opportunity_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_attachments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          notes: string | null
          opportunity_id: string
          relationship_type: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          relationship_type?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "opportunity_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_message_read_receipts: {
        Row: {
          created_at: string | null
          id: string
          last_read_at: string
          opportunity_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_read_at?: string
          opportunity_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_read_at?: string
          opportunity_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_message_read_receipts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_messages: {
        Row: {
          content: string
          created_at: string | null
          format: string | null
          id: string
          is_important: boolean | null
          marked_important_at: string | null
          marked_important_by: string | null
          mentions: string[] | null
          opportunity_id: string
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          format?: string | null
          id?: string
          is_important?: boolean | null
          marked_important_at?: string | null
          marked_important_by?: string | null
          mentions?: string[] | null
          opportunity_id: string
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          format?: string | null
          id?: string
          is_important?: boolean | null
          marked_important_at?: string | null
          marked_important_by?: string | null
          mentions?: string[] | null
          opportunity_id?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_messages_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_quote_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          item_type: string
          opportunity_id: string
          quantity: number
          unit_cost: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          item_type?: string
          opportunity_id: string
          quantity?: number
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          item_type?: string
          opportunity_id?: string
          quantity?: number
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_quote_items_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          company: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      ticket_links: {
        Row: {
          created_at: string
          id: string
          link_type: string
          ticket_id: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link_type: string
          ticket_id: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string
          ticket_id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ticket_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_message_read_receipts: {
        Row: {
          created_at: string | null
          id: string
          last_read_at: string
          ticket_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_read_at?: string
          ticket_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_read_at?: string
          ticket_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_message_read_receipts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string
          format: string | null
          id: string
          is_important: boolean | null
          marked_important_at: string | null
          marked_important_by: string | null
          mentions: string[] | null
          ticket_id: string
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          format?: string | null
          id?: string
          is_important?: boolean | null
          marked_important_at?: string | null
          marked_important_by?: string | null
          mentions?: string[] | null
          ticket_id: string
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          format?: string | null
          id?: string
          is_important?: boolean | null
          marked_important_at?: string | null
          marked_important_by?: string | null
          mentions?: string[] | null
          ticket_id?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_milestones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          person_name: string | null
          status: string
          ticket_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          person_name?: string | null
          status?: string
          ticket_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          person_name?: string | null
          status?: string
          ticket_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_milestones_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_quotes: {
        Row: {
          amount: number
          approval_window_expires_at: string | null
          approved_at: string | null
          approved_by: string | null
          billing_cycles: number | null
          billing_interval: string | null
          client_id: string | null
          created_at: string
          decline_reason: string | null
          deliverables: string[] | null
          id: string
          is_recurring: boolean
          marked_paid_at: string | null
          marked_paid_by: string | null
          paid_at: string | null
          payment_status: string | null
          po_file_url: string | null
          po_number: string | null
          preferred_amount: number | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          ticket_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          approval_window_expires_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_cycles?: number | null
          billing_interval?: string | null
          client_id?: string | null
          created_at?: string
          decline_reason?: string | null
          deliverables?: string[] | null
          id?: string
          is_recurring?: boolean
          marked_paid_at?: string | null
          marked_paid_by?: string | null
          paid_at?: string | null
          payment_status?: string | null
          po_file_url?: string | null
          po_number?: string | null
          preferred_amount?: number | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          ticket_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approval_window_expires_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_cycles?: number | null
          billing_interval?: string | null
          client_id?: string | null
          created_at?: string
          decline_reason?: string | null
          deliverables?: string[] | null
          id?: string
          is_recurring?: boolean
          marked_paid_at?: string | null
          marked_paid_by?: string | null
          paid_at?: string | null
          payment_status?: string | null
          po_file_url?: string | null
          po_number?: string | null
          preferred_amount?: number | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_quotes_marked_paid_by_fkey"
            columns: ["marked_paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_quotes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          assigned_to: string | null
          budget: number | null
          category_id: string | null
          client_id: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string
          description: string
          due_date: string | null
          end_client_name: string | null
          id: string
          managed_service_id: string | null
          parent_ticket_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          revision_notes: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subtype: string | null
          ticket_number: number
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_to?: string | null
          budget?: number | null
          category_id?: string | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by: string
          description: string
          due_date?: string | null
          end_client_name?: string | null
          id?: string
          managed_service_id?: string | null
          parent_ticket_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subtype?: string | null
          ticket_number?: number
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_to?: string | null
          budget?: number | null
          category_id?: string | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          due_date?: string | null
          end_client_name?: string | null
          id?: string
          managed_service_id?: string | null
          parent_ticket_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subtype?: string | null
          ticket_number?: number
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_managed_service_id_fkey"
            columns: ["managed_service_id"]
            isOneToOne: false
            referencedRelation: "managed_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_parent_ticket_id_fkey"
            columns: ["parent_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
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
      calculate_billing_start_date: {
        Args: { ticket_resolved_at: string }
        Returns: string
      }
      cleanup_orphaned_profiles: {
        Args: never
        Returns: {
          deleted_email: string
          deleted_profile_id: string
        }[]
      }
      generate_opportunity_number: { Args: never; Returns: string }
      get_available_agents: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      get_total_mrr: { Args: never; Returns: number }
      get_users_with_roles: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
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
      restore_client: { Args: { client_id_param: string }; Returns: undefined }
      soft_delete_client: {
        Args: { client_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "user"
      client_access_level: "admin" | "member" | "viewer"
      client_type: "direct" | "agency" | "agency_managed"
      dev_build_environment: "development" | "staging" | "production"
      dev_build_status:
        | "building"
        | "success"
        | "failed"
        | "deploying"
        | "deployed"
      dev_project_status:
        | "planning"
        | "in_development"
        | "testing"
        | "staging"
        | "production"
        | "maintenance"
        | "archived"
      dev_project_type:
        | "mobile_app"
        | "web_app"
        | "desktop_app"
        | "api"
        | "integration"
        | "other"
      dev_sprint_status: "planned" | "active" | "completed" | "cancelled"
      dev_task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "in_review"
        | "testing"
        | "done"
        | "blocked"
      dev_task_type:
        | "feature"
        | "bug"
        | "enhancement"
        | "refactor"
        | "documentation"
        | "testing"
        | "devops"
      opportunity_priority: "low" | "medium" | "high" | "critical"
      opportunity_status:
        | "lead"
        | "working_on_rfp"
        | "submitted"
        | "awarded"
        | "lost"
        | "on_hold"
      opportunity_type: "private" | "government"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "awaiting_response"
        | "resolved"
        | "closed"
        | "pending_acknowledgment"
        | "awaiting_payment"
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
      client_access_level: ["admin", "member", "viewer"],
      client_type: ["direct", "agency", "agency_managed"],
      dev_build_environment: ["development", "staging", "production"],
      dev_build_status: [
        "building",
        "success",
        "failed",
        "deploying",
        "deployed",
      ],
      dev_project_status: [
        "planning",
        "in_development",
        "testing",
        "staging",
        "production",
        "maintenance",
        "archived",
      ],
      dev_project_type: [
        "mobile_app",
        "web_app",
        "desktop_app",
        "api",
        "integration",
        "other",
      ],
      dev_sprint_status: ["planned", "active", "completed", "cancelled"],
      dev_task_status: [
        "backlog",
        "todo",
        "in_progress",
        "in_review",
        "testing",
        "done",
        "blocked",
      ],
      dev_task_type: [
        "feature",
        "bug",
        "enhancement",
        "refactor",
        "documentation",
        "testing",
        "devops",
      ],
      opportunity_priority: ["low", "medium", "high", "critical"],
      opportunity_status: [
        "lead",
        "working_on_rfp",
        "submitted",
        "awarded",
        "lost",
        "on_hold",
      ],
      opportunity_type: ["private", "government"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "awaiting_response",
        "resolved",
        "closed",
        "pending_acknowledgment",
        "awaiting_payment",
      ],
    },
  },
} as const
