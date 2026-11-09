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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      credential: {
        Row: {
          created_at: string
          daycare_id: string
          id: string
          password_hash: string
          person_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          id?: string
          password_hash: string
          person_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          id?: string
          password_hash?: string
          person_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_person_fk"
            columns: ["person_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      daycares: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed: {
        Row: {
          author_id: string
          body: string
          created_at: string
          daycare_id: string
          id: string
          room_id: string | null
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at: string
          daycare_id: string
          id?: string
          room_id?: string | null
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          daycare_id?: string
          id?: string
          room_id?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_author_fk"
            columns: ["author_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id", "daycare_id"]
          },
          {
            foreignKeyName: "feed_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_room_fk"
            columns: ["room_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          daycare_id: string
          feed_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at: string
          daycare_id: string
          feed_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          daycare_id?: string
          feed_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_author_fk"
            columns: ["author_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id", "daycare_id"]
          },
          {
            foreignKeyName: "feed_comments_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_feed_fk"
            columns: ["feed_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "feed"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      feed_kids: {
        Row: {
          created_at: string
          daycare_id: string
          feed_id: string
          id: string
          kid_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          feed_id: string
          id?: string
          kid_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          feed_id?: string
          id?: string
          kid_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_kids_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_kids_feed_fk"
            columns: ["feed_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "feed"
            referencedColumns: ["id", "daycare_id"]
          },
          {
            foreignKeyName: "feed_kids_kid_fk"
            columns: ["kid_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      feed_media: {
        Row: {
          alt: string | null
          asset_id: string
          bytes: number
          created_at: string
          daycare_id: string
          delivery_type: Database["public"]["Enums"]["post_media_delivery_type"]
          feed_id: string
          format: Database["public"]["Enums"]["post_media_format"]
          height: number
          id: string
          original_name: string
          position: number
          public_id: string
          resource_type: Database["public"]["Enums"]["post_media_resource_type"]
          updated_at: string
          width: number
        }
        Insert: {
          alt?: string | null
          asset_id: string
          bytes: number
          created_at?: string
          daycare_id: string
          delivery_type: Database["public"]["Enums"]["post_media_delivery_type"]
          feed_id: string
          format: Database["public"]["Enums"]["post_media_format"]
          height: number
          id?: string
          original_name: string
          position: number
          public_id: string
          resource_type: Database["public"]["Enums"]["post_media_resource_type"]
          updated_at?: string
          width: number
        }
        Update: {
          alt?: string | null
          asset_id?: string
          bytes?: number
          created_at?: string
          daycare_id?: string
          delivery_type?: Database["public"]["Enums"]["post_media_delivery_type"]
          feed_id?: string
          format?: Database["public"]["Enums"]["post_media_format"]
          height?: number
          id?: string
          original_name?: string
          position?: number
          public_id?: string
          resource_type?: Database["public"]["Enums"]["post_media_resource_type"]
          updated_at?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_media_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_media_feed_fk"
            columns: ["feed_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "feed"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string
          daycare_id: string
          feed_id: string
          id: string
          person_id: string
          type: Database["public"]["Enums"]["post_reaction_type"]
          updated_at: string
        }
        Insert: {
          created_at: string
          daycare_id: string
          feed_id: string
          id?: string
          person_id: string
          type: Database["public"]["Enums"]["post_reaction_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          feed_id?: string
          id?: string
          person_id?: string
          type?: Database["public"]["Enums"]["post_reaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_reactions_feed_fk"
            columns: ["feed_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "feed"
            referencedColumns: ["id", "daycare_id"]
          },
          {
            foreignKeyName: "feed_reactions_person_fk"
            columns: ["person_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      invitation: {
        Row: {
          accepted_at: string | null
          code: string
          created_at: string
          daycare_id: string
          expires_at: string
          id: string
          kid_id: string
          person_id: string
          relationship: Database["public"]["Enums"]["parent_relationship"]
          sent_at: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          code: string
          created_at?: string
          daycare_id: string
          expires_at: string
          id?: string
          kid_id: string
          person_id: string
          relationship: Database["public"]["Enums"]["parent_relationship"]
          sent_at?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          code?: string
          created_at?: string
          daycare_id?: string
          expires_at?: string
          id?: string
          kid_id?: string
          person_id?: string
          relationship?: Database["public"]["Enums"]["parent_relationship"]
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_kid_fk"
            columns: ["kid_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id", "daycare_id"]
          },
          {
            foreignKeyName: "invitation_person_fk"
            columns: ["person_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      kids: {
        Row: {
          allergies: string
          birth_date: string
          created_at: string
          daycare_id: string
          enrollment_date: string
          id: string
          medical_notes: string
          name: string
          room_id: string
          slug: string
          status: Database["public"]["Enums"]["kid_status"]
          updated_at: string
        }
        Insert: {
          allergies: string
          birth_date: string
          created_at?: string
          daycare_id: string
          enrollment_date: string
          id?: string
          medical_notes: string
          name: string
          room_id: string
          slug: string
          status: Database["public"]["Enums"]["kid_status"]
          updated_at?: string
        }
        Update: {
          allergies?: string
          birth_date?: string
          created_at?: string
          daycare_id?: string
          enrollment_date?: string
          id?: string
          medical_notes?: string
          name?: string
          room_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["kid_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_room_fk"
            columns: ["room_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      parent_kids: {
        Row: {
          created_at: string
          daycare_id: string
          id: string
          kid_id: string
          parent_id: string
          photo_sharing_consent: boolean
          relationship: Database["public"]["Enums"]["parent_relationship"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          id?: string
          kid_id: string
          parent_id: string
          photo_sharing_consent: boolean
          relationship: Database["public"]["Enums"]["parent_relationship"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          id?: string
          kid_id?: string
          parent_id?: string
          photo_sharing_consent?: boolean
          relationship?: Database["public"]["Enums"]["parent_relationship"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_kids_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_kids_kid_fk"
            columns: ["kid_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "kids"
            referencedColumns: ["id", "daycare_id"]
          },
          {
            foreignKeyName: "parent_kids_parent_fk"
            columns: ["parent_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id", "daycare_id"]
          },
        ]
      }
      people: {
        Row: {
          created_at: string
          daycare_id: string
          email: string
          id: string
          job_title: string | null
          name: string
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          email: string
          id?: string
          job_title?: string | null
          name: string
          status: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          email?: string
          id?: string
          job_title?: string | null
          name?: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      people_roles: {
        Row: {
          daycare_id: string
          person_id: string
          role_id: string
        }
        Insert: {
          daycare_id: string
          person_id: string
          role_id: string
        }
        Update: {
          daycare_id?: string
          person_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_roles_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_roles_person_fk"
            columns: ["person_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id", "daycare_id"]
          },
          {
            foreignKeyName: "people_roles_role_fk"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: Database["public"]["Enums"]["person_role"]
          id: string
        }
        Insert: {
          code: Database["public"]["Enums"]["person_role"]
          id?: string
        }
        Update: {
          code?: Database["public"]["Enums"]["person_role"]
          id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          daycare_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_rooms: {
        Row: {
          created_at: string
          daycare_id: string
          id: string
          person_id: string
          room_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daycare_id: string
          id?: string
          person_id: string
          room_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daycare_id?: string
          id?: string
          person_id?: string
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_rooms_daycare_fk"
            columns: ["daycare_id"]
            isOneToOne: false
            referencedRelation: "daycares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_rooms_person_fk"
            columns: ["person_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id", "daycare_id"]
          },
          {
            foreignKeyName: "staff_rooms_room_fk"
            columns: ["room_id", "daycare_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id", "daycare_id"]
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
      kid_status: "active" | "inactive"
      parent_relationship: "mother" | "father" | "guardian"
      person_role: "admin" | "personal" | "teacher" | "parent"
      person_status: "active" | "inactive" | "pending"
      post_media_delivery_type: "authenticated"
      post_media_format: "jpg" | "jpeg" | "png" | "webp"
      post_media_resource_type: "image"
      post_reaction_type: "love"
      post_type:
        | "food"
        | "nap"
        | "activity"
        | "achievement"
        | "mood"
        | "announcement"
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
      kid_status: ["active", "inactive"],
      parent_relationship: ["mother", "father", "guardian"],
      person_role: ["admin", "personal", "teacher", "parent"],
      person_status: ["active", "inactive", "pending"],
      post_media_delivery_type: ["authenticated"],
      post_media_format: ["jpg", "jpeg", "png", "webp"],
      post_media_resource_type: ["image"],
      post_reaction_type: ["love"],
      post_type: [
        "food",
        "nap",
        "activity",
        "achievement",
        "mood",
        "announcement",
      ],
    },
  },
} as const
