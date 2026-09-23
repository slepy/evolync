export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          read_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          announcement_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          read_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          announcement_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          read_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          author_id: string;
          content: string;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          priority: Database["public"]["Enums"]["priority_level"] | null;
          school_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["priority_level"] | null;
          school_id: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["priority_level"] | null;
          school_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          created_at: string | null;
          date: string;
          deleted_at: string | null;
          id: string;
          school_id: string;
          school_member_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          deleted_at?: string | null;
          id?: string;
          school_id: string;
          school_member_id: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          deleted_at?: string | null;
          id?: string;
          school_id?: string;
          school_member_id?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_school_member_id_fkey";
            columns: ["school_member_id"];
            isOneToOne: false;
            referencedRelation: "school_members";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          commentable_id: string;
          commentable_type: string | null;
          content: string;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          commentable_id: string;
          commentable_type?: string | null;
          content: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          commentable_id?: string;
          commentable_type?: string | null;
          content?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string | null;
          currency: string | null;
          deleted_at: string | null;
          id: string;
          order_id: string | null;
          product_variant_id: string | null;
          quantity: number;
          unit_price: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string | null;
          deleted_at?: string | null;
          id?: string;
          order_id?: string | null;
          product_variant_id?: string | null;
          quantity?: number;
          unit_price: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          deleted_at?: string | null;
          id?: string;
          order_id?: string | null;
          product_variant_id?: string | null;
          quantity?: number;
          unit_price?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey";
            columns: ["product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          school_id: string;
          school_member_id: string;
          status: Database["public"]["Enums"]["order_status"] | null;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          school_id: string;
          school_member_id: string;
          status?: Database["public"]["Enums"]["order_status"] | null;
          total_amount?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          school_id?: string;
          school_member_id?: string;
          status?: Database["public"]["Enums"]["order_status"] | null;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_school_member_id_fkey";
            columns: ["school_member_id"];
            isOneToOne: false;
            referencedRelation: "school_members";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_roles: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          is_system_default: boolean | null;
          name: string;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_system_default?: boolean | null;
          name: string;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_system_default?: boolean | null;
          name?: string;
          organization_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organization_roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string | null;
          currency_code: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency_code?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency_code?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string | null;
          deleted_at: string | null;
          id: string;
          method: Database["public"]["Enums"]["payment_method"] | null;
          payment_date: string | null;
          period_end: string | null;
          period_start: string | null;
          school_id: string;
          school_member_id: string;
          status: Database["public"]["Enums"]["payment_status"] | null;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string | null;
          deleted_at?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_date?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          school_id: string;
          school_member_id: string;
          status?: Database["public"]["Enums"]["payment_status"] | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string | null;
          deleted_at?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_date?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          school_id?: string;
          school_member_id?: string;
          status?: Database["public"]["Enums"]["payment_status"] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_school_member_id_fkey";
            columns: ["school_member_id"];
            isOneToOne: false;
            referencedRelation: "school_members";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_sequences: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          order_index: number;
          sequence_id: string | null;
          training_plan_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          order_index: number;
          sequence_id?: string | null;
          training_plan_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          order_index?: number;
          sequence_id?: string | null;
          training_plan_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "plan_sequences_sequence_id_fkey";
            columns: ["sequence_id"];
            isOneToOne: false;
            referencedRelation: "sequences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_sequences_training_plan_id_fkey";
            columns: ["training_plan_id"];
            isOneToOne: false;
            referencedRelation: "training_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          created_at: string | null;
          currency: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          price: number;
          product_id: string;
          stock_quantity: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          price?: number;
          product_id: string;
          stock_quantity?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          price?: number;
          product_id?: string;
          stock_quantity?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          organization_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      school_invites: {
        Row: {
          code: string;
          created_at: string | null;
          created_by: string | null;
          deleted_at: string | null;
          expires_at: string;
          id: string;
          role_id: string | null;
          school_id: string;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          expires_at: string;
          id?: string;
          role_id?: string | null;
          school_id: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          expires_at?: string;
          id?: string;
          role_id?: string | null;
          school_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "school_invites_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "organization_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_invites_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      school_members: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          display_name: string | null;
          email: string | null;
          id: string;
          joined_at: string | null;
          role_id: string | null;
          school_id: string;
          status: Database["public"]["Enums"]["member_status"] | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          joined_at?: string | null;
          role_id?: string | null;
          school_id: string;
          status?: Database["public"]["Enums"]["member_status"] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          joined_at?: string | null;
          role_id?: string | null;
          school_id?: string;
          status?: Database["public"]["Enums"]["member_status"] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "school_members_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "organization_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_members_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      schools: {
        Row: {
          address: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "schools_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sequence_steps: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          duration_ms: number | null;
          id: string;
          order_index: number;
          sequence_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          duration_ms?: number | null;
          id?: string;
          order_index: number;
          sequence_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          duration_ms?: number | null;
          id?: string;
          order_index?: number;
          sequence_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey";
            columns: ["sequence_id"];
            isOneToOne: false;
            referencedRelation: "sequences";
            referencedColumns: ["id"];
          },
        ];
      };
      sequences: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      step_techniques: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          model_slot: number | null;
          root_position: Json | null;
          root_rotation: Json | null;
          step_id: string | null;
          technique_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          model_slot?: number | null;
          root_position?: Json | null;
          root_rotation?: Json | null;
          step_id?: string | null;
          technique_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          model_slot?: number | null;
          root_position?: Json | null;
          root_rotation?: Json | null;
          step_id?: string | null;
          technique_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "step_techniques_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "sequence_steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "step_techniques_technique_id_fkey";
            columns: ["technique_id"];
            isOneToOne: false;
            referencedRelation: "techniques";
            referencedColumns: ["id"];
          },
        ];
      };
      taggables: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          tag_id: string | null;
          taggable_id: string;
          taggable_type: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          tag_id?: string | null;
          taggable_id: string;
          taggable_type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          tag_id?: string | null;
          taggable_id?: string;
          taggable_type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "taggables_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      techniques: {
        Row: {
          body_part: string;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          rotation_data: Json;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          body_part: string;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          rotation_data: Json;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          body_part?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          rotation_data?: Json;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      training_plans: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_member_of_org_school: { Args: { org_id: string }; Returns: boolean };
      is_member_of_school: { Args: { school_id: string }; Returns: boolean };
      register_instructor: {
        Args: {
          p_email: string;
          p_full_name: string;
          p_organization_name: string;
          p_password: string;
          p_school_name: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      attendance_status: "present" | "absent" | "excused";
      member_status: "pending" | "active" | "archived" | "rejected";
      order_status:
        | "placed"
        | "processing"
        | "ready_for_pickup"
        | "completed"
        | "paid";
      payment_method: "cash" | "transfer" | "other";
      payment_status: "paid" | "pending" | "cancelled";
      priority_level: "normal" | "high";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attendance_status: ["present", "absent", "excused"],
      member_status: ["pending", "active", "archived", "rejected"],
      order_status: [
        "placed",
        "processing",
        "ready_for_pickup",
        "completed",
        "paid",
      ],
      payment_method: ["cash", "transfer", "other"],
      payment_status: ["paid", "pending", "cancelled"],
      priority_level: ["normal", "high"],
    },
  },
} as const;
