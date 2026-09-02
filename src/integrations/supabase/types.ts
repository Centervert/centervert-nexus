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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          attachment_url: string | null
          body: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          follow_up_done: boolean
          follow_up_on: string | null
          id: string
          interest_level: string | null
          left_behind: string | null
          occurred_at: string
          organization_id: string | null
          outcome: string | null
          owner_id: string | null
          person_spoken_to: string | null
          project_id: string | null
          prospect_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          activity_type?: string
          attachment_url?: string | null
          body?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          follow_up_done?: boolean
          follow_up_on?: string | null
          id?: string
          interest_level?: string | null
          left_behind?: string | null
          occurred_at?: string
          organization_id?: string | null
          outcome?: string | null
          owner_id?: string | null
          person_spoken_to?: string | null
          project_id?: string | null
          prospect_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          activity_type?: string
          attachment_url?: string | null
          body?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          follow_up_done?: boolean
          follow_up_on?: string | null
          id?: string
          interest_level?: string | null
          left_behind?: string | null
          occurred_at?: string
          organization_id?: string | null
          outcome?: string | null
          owner_id?: string | null
          person_spoken_to?: string | null
          project_id?: string | null
          prospect_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_source: string
          changed_fields: Json | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_source?: string
          changed_fields?: Json | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_source?: string
          changed_fields?: Json | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
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
      deal_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          deal_id: string
          id: string
          message_id: string | null
          name: string
          storage_path: string | null
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          attachment_type?: string
          created_at?: string
          deal_id: string
          id?: string
          message_id?: string | null
          name: string
          storage_path?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          attachment_type?: string
          created_at?: string
          deal_id?: string
          id?: string
          message_id?: string | null
          name?: string
          storage_path?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_attachments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "deal_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_competitors: {
        Row: {
          competitor_type: string
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          name: string
          our_strategy: string | null
          position: string
          strengths: string | null
          updated_at: string
          weaknesses: string | null
        }
        Insert: {
          competitor_type?: string
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          name: string
          our_strategy?: string | null
          position?: string
          strengths?: string | null
          updated_at?: string
          weaknesses?: string | null
        }
        Update: {
          competitor_type?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          name?: string
          our_strategy?: string | null
          position?: string
          strengths?: string | null
          updated_at?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_competitors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_competitors_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_criteria: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          criterion: string
          deal_id: string
          id: string
          must_have: boolean
          notes: string | null
          our_position: string
          resolved: boolean
          updated_at: string
          weight: number
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          criterion: string
          deal_id: string
          id?: string
          must_have?: boolean
          notes?: string | null
          our_position?: string
          resolved?: boolean
          updated_at?: string
          weight?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          criterion?: string
          deal_id?: string
          id?: string
          must_have?: boolean
          notes?: string | null
          our_position?: string
          resolved?: boolean
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_criteria_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_criteria_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_elements: {
        Row: {
          created_at: string
          deal_id: string
          element: string
          id: string
          last_verified_at: string | null
          score: number
          summary: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          element: string
          id?: string
          last_verified_at?: string | null
          score?: number
          summary?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          element?: string
          id?: string
          last_verified_at?: string | null
          score?: number
          summary?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_elements_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_elements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_evidence: {
        Row: {
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          element: string | null
          id: string
          note: string
          occurred_on: string
          source: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          element?: string | null
          id?: string
          note: string
          occurred_on?: string
          source?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          element?: string | null
          id?: string
          note?: string
          occurred_on?: string
          source?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_evidence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_evidence_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "deal_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_messages: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deal_id: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deal_id: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_metrics: {
        Row: {
          baseline: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          name: string
          notes: string | null
          owner_name: string | null
          target: string | null
          timeframe: string | null
          unit: string | null
          updated_at: string
          validated: boolean
        }
        Insert: {
          baseline?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          name: string
          notes?: string | null
          owner_name?: string | null
          target?: string | null
          timeframe?: string | null
          unit?: string | null
          updated_at?: string
          validated?: boolean
        }
        Update: {
          baseline?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          name?: string
          notes?: string | null
          owner_name?: string | null
          target?: string | null
          timeframe?: string | null
          unit?: string | null
          updated_at?: string
          validated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "deal_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_metrics_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_next_actions: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string
          description: string
          due_date: string | null
          id: string
          owner_name: string | null
          owner_side: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id: string
          description: string
          due_date?: string | null
          id?: string
          owner_name?: string | null
          owner_side?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string
          description?: string
          due_date?: string | null
          id?: string
          owner_name?: string | null
          owner_side?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_next_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_next_actions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_pains: {
        Row: {
          buyer_owned: boolean
          consequence: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          description: string
          id: string
          impact: string | null
          level: string
          owner_name: string | null
          updated_at: string
        }
        Insert: {
          buyer_owned?: boolean
          consequence?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          description: string
          id?: string
          impact?: string | null
          level?: string
          owner_name?: string | null
          updated_at?: string
        }
        Update: {
          buyer_owned?: boolean
          consequence?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          description?: string
          id?: string
          impact?: string | null
          level?: string
          owner_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_pains_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_pains_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_people: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string | null
          deal_id: string
          deal_role: string
          id: string
          influence: string | null
          notes: string | null
          stance: string | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string | null
          deal_id: string
          deal_role?: string
          id?: string
          influence?: string | null
          notes?: string | null
          stance?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string
          deal_role?: string
          id?: string
          influence?: string | null
          notes?: string | null
          stance?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_people_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_people_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_process_steps: {
        Row: {
          category: string
          confirmed_by_buyer: boolean
          created_at: string
          created_by: string | null
          deal_id: string
          due_date: string | null
          id: string
          name: string
          notes: string | null
          owner_name: string | null
          sequence: number
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          confirmed_by_buyer?: boolean
          created_at?: string
          created_by?: string | null
          deal_id: string
          due_date?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_name?: string | null
          sequence?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          confirmed_by_buyer?: boolean
          created_at?: string
          created_by?: string | null
          deal_id?: string
          due_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_name?: string | null
          sequence?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_process_steps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_process_steps_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_risks: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string
          description: string
          due_date: string | null
          id: string
          mitigation: string | null
          owner_name: string | null
          probability: string
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id: string
          description: string
          due_date?: string | null
          id?: string
          mitigation?: string | null
          owner_name?: string | null
          probability?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string
          description?: string
          due_date?: string | null
          id?: string
          mitigation?: string | null
          owner_name?: string | null
          probability?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_risks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_risks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_score_snapshots: {
        Row: {
          created_at: string
          created_by: string | null
          critical_gap_count: number
          deal_id: string
          id: string
          scores: Json
          stage: string | null
          total_score: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          critical_gap_count?: number
          deal_id: string
          id?: string
          scores?: Json
          stage?: string | null
          total_score?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          critical_gap_count?: number
          deal_id?: string
          id?: string
          scores?: Json
          stage?: string | null
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_score_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_score_snapshots_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_history: {
        Row: {
          changed_by: string | null
          created_at: string
          deal_id: string
          from_stage: string | null
          id: string
          override_reason: string | null
          to_stage: string
          unmet_gates: Json
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          deal_id: string
          from_stage?: string | null
          id?: string
          override_reason?: string | null
          to_stage: string
          unmet_gates?: Json
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          deal_id?: string
          from_stage?: string | null
          id?: string
          override_reason?: string | null
          to_stage?: string
          unmet_gates?: Json
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stakeholders: {
        Row: {
          authority: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          influence: string
          last_engaged_on: string | null
          name: string
          notes: string | null
          relationship_strength: string
          role: string
          stance: string
          title: string | null
          updated_at: string
        }
        Insert: {
          authority?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          influence?: string
          last_engaged_on?: string | null
          name: string
          notes?: string | null
          relationship_strength?: string
          role?: string
          stance?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          authority?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          influence?: string
          last_engaged_on?: string | null
          name?: string
          notes?: string | null
          relationship_strength?: string
          role?: string
          stance?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_stakeholders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stakeholders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stakeholders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_winner: string | null
          close_date: string | null
          compelling_event: string | null
          compelling_event_date: string | null
          contact_id: string | null
          contract_status: string | null
          created_at: string
          created_by: string | null
          critical_gap_count: number
          description: string | null
          economic_buyer_confirmed: boolean | null
          expected_value: number | null
          forecast_category: string
          gate_override_reason: string | null
          had_champion: boolean | null
          id: string
          legal_review_status: string | null
          loss_category: string | null
          loss_detail: string | null
          loss_type: string | null
          lost_reason: string | null
          methodology_profile: string
          name: string
          next_action: string | null
          next_action_due_at: string | null
          next_action_owner: string | null
          organization_id: string | null
          owner_id: string | null
          payment_schedule: string | null
          po_status: string | null
          pricing_model: string | null
          prospect_id: string | null
          qualification_score: number
          quoted_amount: number | null
          reengage_on: string | null
          scope_summary: string | null
          security_review_status: string | null
          signer_name: string | null
          signer_title: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          status: string
          target_decision_date: string | null
          target_signature_date: string | null
          temperature: number
          updated_at: string
          why_change: string | null
          why_now: string | null
          why_us: string | null
          win_reason: string | null
        }
        Insert: {
          actual_winner?: string | null
          close_date?: string | null
          compelling_event?: string | null
          compelling_event_date?: string | null
          contact_id?: string | null
          contract_status?: string | null
          created_at?: string
          created_by?: string | null
          critical_gap_count?: number
          description?: string | null
          economic_buyer_confirmed?: boolean | null
          expected_value?: number | null
          forecast_category?: string
          gate_override_reason?: string | null
          had_champion?: boolean | null
          id?: string
          legal_review_status?: string | null
          loss_category?: string | null
          loss_detail?: string | null
          loss_type?: string | null
          lost_reason?: string | null
          methodology_profile?: string
          name: string
          next_action?: string | null
          next_action_due_at?: string | null
          next_action_owner?: string | null
          organization_id?: string | null
          owner_id?: string | null
          payment_schedule?: string | null
          po_status?: string | null
          pricing_model?: string | null
          prospect_id?: string | null
          qualification_score?: number
          quoted_amount?: number | null
          reengage_on?: string | null
          scope_summary?: string | null
          security_review_status?: string | null
          signer_name?: string | null
          signer_title?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          status?: string
          target_decision_date?: string | null
          target_signature_date?: string | null
          temperature?: number
          updated_at?: string
          why_change?: string | null
          why_now?: string | null
          why_us?: string | null
          win_reason?: string | null
        }
        Update: {
          actual_winner?: string | null
          close_date?: string | null
          compelling_event?: string | null
          compelling_event_date?: string | null
          contact_id?: string | null
          contract_status?: string | null
          created_at?: string
          created_by?: string | null
          critical_gap_count?: number
          description?: string | null
          economic_buyer_confirmed?: boolean | null
          expected_value?: number | null
          forecast_category?: string
          gate_override_reason?: string | null
          had_champion?: boolean | null
          id?: string
          legal_review_status?: string | null
          loss_category?: string | null
          loss_detail?: string | null
          loss_type?: string | null
          lost_reason?: string | null
          methodology_profile?: string
          name?: string
          next_action?: string | null
          next_action_due_at?: string | null
          next_action_owner?: string | null
          organization_id?: string | null
          owner_id?: string | null
          payment_schedule?: string | null
          po_status?: string | null
          pricing_model?: string | null
          prospect_id?: string | null
          qualification_score?: number
          quoted_amount?: number | null
          reengage_on?: string | null
          scope_summary?: string | null
          security_review_status?: string | null
          signer_name?: string | null
          signer_title?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          status?: string
          target_decision_date?: string | null
          target_signature_date?: string | null
          temperature?: number
          updated_at?: string
          why_change?: string | null
          why_now?: string | null
          why_us?: string | null
          win_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_attachments: {
        Row: {
          attachment_type: string | null
          created_at: string | null
          created_by: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          position: number | null
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          position?: number | null
        }
        Update: {
          attachment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attachments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_compensation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attachments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_notes: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_compensation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
          salary_type: string
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
          salary_type?: string
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
          salary_type?: string
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
            referencedRelation: "employee_compensation"
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
          legal_name: string | null
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
          legal_name?: string | null
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
          legal_name?: string | null
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
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_account: string | null
          start_date: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_account?: string | null
          start_date?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_account?: string | null
          start_date?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          end_date: string | null
          frequency: string
          id: string
          name: string
          notes: string | null
          projected_start_date: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          notes?: string | null
          projected_start_date?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          projected_start_date?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      income_associated_expenses: {
        Row: {
          created_at: string | null
          created_by: string | null
          expense_id: string | null
          id: string
          income_id: string
          is_projected: boolean | null
          notes: string | null
          projected_expense_amount: number | null
          projected_expense_frequency: string | null
          projected_expense_name: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expense_id?: string | null
          id?: string
          income_id: string
          is_projected?: boolean | null
          notes?: string | null
          projected_expense_amount?: number | null
          projected_expense_frequency?: string | null
          projected_expense_name?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expense_id?: string | null
          id?: string
          income_id?: string
          is_projected?: boolean | null
          notes?: string | null
          projected_expense_amount?: number | null
          projected_expense_frequency?: string | null
          projected_expense_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_associated_expenses_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_associated_expenses_income_id_fkey"
            columns: ["income_id"]
            isOneToOne: false
            referencedRelation: "income"
            referencedColumns: ["id"]
          },
        ]
      }
      income_employee_costs: {
        Row: {
          allocation_percentage: number | null
          created_at: string | null
          created_by: string | null
          employee_id: string
          id: string
          income_id: string
          notes: string | null
        }
        Insert: {
          allocation_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          id?: string
          income_id: string
          notes?: string | null
        }
        Update: {
          allocation_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          id?: string
          income_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_employee_costs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_compensation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_employee_costs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_employee_costs_income_id_fkey"
            columns: ["income_id"]
            isOneToOne: false
            referencedRelation: "income"
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
      mcp_audit_log: {
        Row: {
          actor_label: string | null
          created_at: string
          error_message: string | null
          id: string
          input: Json | null
          output_summary: string | null
          success: boolean
          tool_name: string
        }
        Insert: {
          actor_label?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input?: Json | null
          output_summary?: string | null
          success: boolean
          tool_name: string
        }
        Update: {
          actor_label?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input?: Json | null
          output_summary?: string | null
          success?: boolean
          tool_name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
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
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_attachments: {
        Row: {
          attachment_type: string | null
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          organization_id: string
          position: number | null
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          organization_id: string
          position?: number | null
        }
        Update: {
          attachment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          organization_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          relationship_status: string
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
          relationship_status?: string
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
          relationship_status?: string
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
      project_daily_standups: {
        Row: {
          accomplishments: string | null
          blockers: string | null
          id: string
          no_work_reason: string | null
          project_id: string
          standup_date: string
          submitted_at: string | null
          tomorrow_plan: string | null
          user_id: string
          work_performed: boolean
        }
        Insert: {
          accomplishments?: string | null
          blockers?: string | null
          id?: string
          no_work_reason?: string | null
          project_id: string
          standup_date: string
          submitted_at?: string | null
          tomorrow_plan?: string | null
          user_id: string
          work_performed?: boolean
        }
        Update: {
          accomplishments?: string | null
          blockers?: string | null
          id?: string
          no_work_reason?: string | null
          project_id?: string
          standup_date?: string
          submitted_at?: string | null
          tomorrow_plan?: string | null
          user_id?: string
          work_performed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "project_daily_standups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_daily_standups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_decisions: {
        Row: {
          created_at: string | null
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          decision: string | null
          description: string | null
          id: string
          project_id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          description?: string | null
          id?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          description?: string | null
          id?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_features: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          position: number | null
          priority: string | null
          project_id: string
          status: string
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          position?: number | null
          priority?: string | null
          project_id: string
          status?: string
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          priority?: string | null
          project_id?: string
          status?: string
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_links: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          label: string
          note: string | null
          owner_id: string | null
          position: number
          project_id: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          note?: string | null
          owner_id?: string | null
          position?: number
          project_id: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          note?: string | null
          owner_id?: string | null
          position?: number
          project_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_meetings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          is_recurring: boolean | null
          location: string | null
          meeting_type: string | null
          notes: string | null
          project_id: string
          recurrence_rule: string | null
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          meeting_type?: string | null
          notes?: string | null
          project_id: string
          recurrence_rule?: string | null
          start_time: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          meeting_type?: string | null
          notes?: string | null
          project_id?: string
          recurrence_rule?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          name: string
          position: number | null
          project_id: string
          resource_type: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          name: string
          position?: number | null
          project_id: string
          resource_type: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          name?: string
          position?: number | null
          project_id?: string
          resource_type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_risks: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          likelihood: string
          mitigation: string | null
          owner_id: string | null
          project_id: string
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          likelihood?: string
          mitigation?: string | null
          owner_id?: string | null
          project_id: string
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          likelihood?: string
          mitigation?: string | null
          owner_id?: string | null
          project_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_secret_refs: {
        Row: {
          created_at: string
          created_by: string | null
          environment: string
          id: string
          last_rotated_on: string | null
          location_path: string | null
          manager: string
          name: string
          owner_id: string | null
          project_id: string
          rotation_notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          last_rotated_on?: string | null
          location_path?: string | null
          manager?: string
          name: string
          owner_id?: string | null
          project_id: string
          rotation_notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          last_rotated_on?: string | null
          location_path?: string | null
          manager?: string
          name?: string
          owner_id?: string | null
          project_id?: string
          rotation_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_secret_refs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_secret_refs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_secret_refs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sprints: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          goal: string | null
          id: string
          name: string
          project_id: string
          sprint_number: number
          start_date: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          project_id: string
          sprint_number: number
          start_date?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          sprint_number?: number
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sprints_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task_assignees: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_task_assignees_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          feature_id: string | null
          id: string
          is_pending: boolean
          position: number | null
          priority: string | null
          project_id: string
          sprint_id: string | null
          status: string
          story_points: number | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          feature_id?: string | null
          id?: string
          is_pending?: boolean
          position?: number | null
          priority?: string | null
          project_id: string
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          task_type?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          feature_id?: string | null
          id?: string
          is_pending?: boolean
          position?: number | null
          priority?: string | null
          project_id?: string
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "project_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "project_sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          id: string
          is_eod_required: boolean | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          is_eod_required?: boolean | null
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          is_eod_required?: boolean | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_types: {
        Row: {
          created_at: string | null
          default_roles: Json
          display_name: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          default_roles?: Json
          display_name: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          default_roles?: Json
          display_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_updates: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          project_id: string
          update_type: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          project_id: string
          update_type?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          eod_required_roles: Json | null
          health: string | null
          health_notes: string | null
          id: string
          name: string
          organization_id: string | null
          owner_id: string | null
          phase_target: string | null
          project_type_id: string | null
          start_date: string | null
          status: string
          target_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          eod_required_roles?: Json | null
          health?: string | null
          health_notes?: string | null
          id?: string
          name: string
          organization_id?: string | null
          owner_id?: string | null
          phase_target?: string | null
          project_type_id?: string | null
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          eod_required_roles?: Json | null
          health?: string | null
          health_notes?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          owner_id?: string | null
          phase_target?: string | null
          project_type_id?: string | null
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_visits: {
        Row: {
          contact_made: Database["public"]["Enums"]["visit_contact_made"]
          created_at: string
          created_by: string | null
          follow_up_done: boolean
          follow_up_due: string | null
          id: string
          outcome_notes: string | null
          person_spoken_to: string | null
          prospect_id: string
          rep_id: string | null
          updated_at: string
          visited_at: string
        }
        Insert: {
          contact_made?: Database["public"]["Enums"]["visit_contact_made"]
          created_at?: string
          created_by?: string | null
          follow_up_done?: boolean
          follow_up_due?: string | null
          id?: string
          outcome_notes?: string | null
          person_spoken_to?: string | null
          prospect_id: string
          rep_id?: string | null
          updated_at?: string
          visited_at?: string
        }
        Update: {
          contact_made?: Database["public"]["Enums"]["visit_contact_made"]
          created_at?: string
          created_by?: string | null
          follow_up_done?: boolean
          follow_up_due?: string | null
          id?: string
          outcome_notes?: string | null
          person_spoken_to?: string | null
          prospect_id?: string
          rep_id?: string | null
          updated_at?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_visits_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          address: string | null
          campaign: string | null
          category: string | null
          city: string | null
          converted_deal_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          discovery_scheduled: boolean
          has_possible_problem: boolean
          id: string
          interest_level: string | null
          last_activity_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          next_action: string | null
          next_action_due_on: string | null
          notes: string | null
          organization_id: string | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          primary_contact_id: string | null
          source: string | null
          spoke_with_relevant_person: boolean
          stage: Database["public"]["Enums"]["prospect_stage"]
          stage_changed_at: string
          state: string | null
          status: Database["public"]["Enums"]["prospect_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          campaign?: string | null
          category?: string | null
          city?: string | null
          converted_deal_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          discovery_scheduled?: boolean
          has_possible_problem?: boolean
          id?: string
          interest_level?: string | null
          last_activity_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          next_action?: string | null
          next_action_due_on?: string | null
          notes?: string | null
          organization_id?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_contact_id?: string | null
          source?: string | null
          spoke_with_relevant_person?: boolean
          stage?: Database["public"]["Enums"]["prospect_stage"]
          stage_changed_at?: string
          state?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          campaign?: string | null
          category?: string | null
          city?: string | null
          converted_deal_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          discovery_scheduled?: boolean
          has_possible_problem?: boolean
          id?: string
          interest_level?: string | null
          last_activity_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          next_action?: string | null
          next_action_due_on?: string | null
          notes?: string | null
          organization_id?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_contact_id?: string | null
          source?: string | null
          spoke_with_relevant_person?: boolean
          stage?: Database["public"]["Enums"]["prospect_stage"]
          stage_changed_at?: string
          state?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_converted_deal_id_fkey"
            columns: ["converted_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
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
      social_posts: {
        Row: {
          copy: string | null
          created_at: string
          created_by: string | null
          id: string
          media_urls: string[]
          notes: string | null
          organization_id: string | null
          platforms: string[]
          scheduled_date: string
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          copy?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          media_urls?: string[]
          notes?: string | null
          organization_id?: string | null
          platforms?: string[]
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          copy?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          media_urls?: string[]
          notes?: string | null
          organization_id?: string | null
          platforms?: string[]
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_organization_id_fkey"
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
      tasks: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          details: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          owner_id: string | null
          owner_name: string | null
          owner_side: string
          priority: string
          prospect_id: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          details?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_side?: string
          priority?: string
          prospect_id?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          details?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_side?: string
          priority?: string
          prospect_id?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
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
      wiki_pages: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          page_type: string
          parent_id: string | null
          position: number
          project_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          page_type?: string
          parent_id?: string | null
          position?: number
          project_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          page_type?: string
          parent_id?: string | null
          position?: number
          project_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wiki_pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      activity_volume: {
        Row: {
          activity_count: number | null
          activity_type: string | null
          owner_id: string | null
          week: string | null
        }
        Relationships: []
      }
      employee_compensation: {
        Row: {
          annual: number | null
          country: string | null
          effective_amount: number | null
          effective_salary_type: string | null
          first_name: string | null
          from_raise: boolean | null
          id: string | null
          is_active: boolean | null
          last_name: string | null
          name: string | null
          per_month: number | null
          per_paycheck: number | null
          position: string | null
          start_date: string | null
        }
        Relationships: []
      }
      opportunity_pipeline: {
        Row: {
          avg_score: number | null
          deal_count: number | null
          pipeline_value: number | null
          stage: string | null
          total_gaps: number | null
        }
        Relationships: []
      }
      prospect_conversion: {
        Row: {
          converted_prospects: number | null
          discovery_scheduled: number | null
          owner_id: string | null
          total_prospects: number | null
        }
        Relationships: []
      }
      prospect_stage_counts: {
        Row: {
          avg_days_in_stage: number | null
          prospect_count: number | null
          stage: string | null
          stale_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_deal: { Args: { _deal_id: string }; Returns: boolean }
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
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
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
      recompute_deal_qualification_score: {
        Args: { _deal_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "user" | "sales_agent"
      billcom_activity_type:
        | "customer_linked"
        | "customer_auto_linked"
        | "invoice_synced"
        | "sync_completed"
        | "sync_failed"
        | "manual_link"
      deal_stage:
        | "discovery"
        | "qualified"
        | "solution_fit"
        | "preferred_vendor"
        | "commercial"
        | "commit"
        | "won"
        | "lost"
        | "on_hold"
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
        | "passed"
      opportunity_type: "private" | "government"
      opportunity_update_type:
        | "manual"
        | "status_change"
        | "assignment_change"
        | "resource_added"
      prospect_stage:
        | "target"
        | "prospect"
        | "contacted"
        | "connected"
        | "discovery_scheduled"
        | "converted"
      prospect_status: "new" | "warm" | "cold" | "do_not_contact" | "converted"
      submission_location_type: "in_person" | "online" | "other"
      visit_contact_made: "yes" | "no" | "card_only"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "agent", "user", "sales_agent"],
      billcom_activity_type: [
        "customer_linked",
        "customer_auto_linked",
        "invoice_synced",
        "sync_completed",
        "sync_failed",
        "manual_link",
      ],
      deal_stage: [
        "discovery",
        "qualified",
        "solution_fit",
        "preferred_vendor",
        "commercial",
        "commit",
        "won",
        "lost",
        "on_hold",
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
        "passed",
      ],
      opportunity_type: ["private", "government"],
      opportunity_update_type: [
        "manual",
        "status_change",
        "assignment_change",
        "resource_added",
      ],
      prospect_stage: [
        "target",
        "prospect",
        "contacted",
        "connected",
        "discovery_scheduled",
        "converted",
      ],
      prospect_status: ["new", "warm", "cold", "do_not_contact", "converted"],
      submission_location_type: ["in_person", "online", "other"],
      visit_contact_made: ["yes", "no", "card_only"],
    },
  },
} as const
