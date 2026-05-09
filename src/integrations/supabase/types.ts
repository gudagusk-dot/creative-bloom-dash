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
      admin_visits: {
        Row: {
          id: string
          last_seen_at: string
          owner_id: string
          student_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string
          owner_id: string
          student_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string
          owner_id?: string
          student_id?: string
        }
        Relationships: []
      }
      content_posts: {
        Row: {
          category: string
          created_at: string
          date: string
          format: string
          id: string
          media_urls: string[]
          network: string
          notes: string
          published_url: string
          script: string
          status: string
          student_id: string | null
          student_notes: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          date: string
          format: string
          id?: string
          media_urls?: string[]
          network: string
          notes?: string
          published_url?: string
          script?: string
          status?: string
          student_id?: string | null
          student_notes?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          format?: string
          id?: string
          media_urls?: string[]
          network?: string
          notes?: string
          published_url?: string
          script?: string
          status?: string
          student_id?: string | null
          student_notes?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "simple_users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          category: string
          created_at: string
          default_script: string
          default_title: string
          format: string
          id: string
          name: string
          network: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          default_script?: string
          default_title?: string
          format: string
          id?: string
          name: string
          network?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_script?: string
          default_title?: string
          format?: string
          id?: string
          name?: string
          network?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      follower_snapshots: {
        Row: {
          captured_at: string
          captured_date: string
          created_at: string
          followers: number
          follows: number
          handle: string
          id: string
          platform: string
          posts_count: number
          raw: Json
          student_id: string
        }
        Insert: {
          captured_at?: string
          captured_date?: string
          created_at?: string
          followers?: number
          follows?: number
          handle: string
          id?: string
          platform?: string
          posts_count?: number
          raw?: Json
          student_id: string
        }
        Update: {
          captured_at?: string
          captured_date?: string
          created_at?: string
          followers?: number
          follows?: number
          handle?: string
          id?: string
          platform?: string
          posts_count?: number
          raw?: Json
          student_id?: string
        }
        Relationships: []
      }
      post_activity: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          post_id: string
          student_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          post_id: string
          student_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          post_id?: string
          student_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          comments: number
          created_at: string
          engagement_rate: number
          fetched_at: string
          id: string
          likes: number
          platform: string
          post_id: string
          raw: Json
          shares: number
          updated_at: string
          views: number
        }
        Insert: {
          comments?: number
          created_at?: string
          engagement_rate?: number
          fetched_at?: string
          id?: string
          likes?: number
          platform?: string
          post_id: string
          raw?: Json
          shares?: number
          updated_at?: string
          views?: number
        }
        Update: {
          comments?: number
          created_at?: string
          engagement_rate?: number
          fetched_at?: string
          id?: string
          likes?: number
          platform?: string
          post_id?: string
          raw?: Json
          shares?: number
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      simple_users: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          order_index: number
          student_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          order_index?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          instagram_handle: string | null
          name: string
          owner_id: string
          slug: string
          tiktok_handle: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          name: string
          owner_id: string
          slug: string
          tiktok_handle?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          name?: string
          owner_id?: string
          slug?: string
          tiktok_handle?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
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
