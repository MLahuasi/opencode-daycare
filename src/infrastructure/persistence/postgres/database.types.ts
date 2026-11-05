/**
 * Generated snapshot of the remote Supabase PostgreSQL schema.
 *
 * This file belongs to Infrastructure and must not be imported by Domain,
 * Application, or Presentation. Regenerate it when the remote schema changes.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      credential: Table<{
        created_at: string;
        daycare_id: string;
        id: string;
        password_hash: string;
        person_id: string;
        updated_at: string;
      }>;
      daycares: Table<{
        created_at: string;
        id: string;
        name: string;
        updated_at: string;
      }>;
      feed: Table<{
        author_id: string;
        body: string;
        created_at: string;
        daycare_id: string;
        id: string;
        room_id: string | null;
        type: Enums<"post_type">;
        updated_at: string;
      }>;
      feed_comments: Table<{
        author_id: string;
        body: string;
        created_at: string;
        daycare_id: string;
        feed_id: string;
        id: string;
        updated_at: string | null;
      }>;
      feed_kids: Table<{
        created_at: string;
        daycare_id: string;
        feed_id: string;
        id: string;
        kid_id: string;
        updated_at: string;
      }>;
      feed_media: Table<{
        alt: string | null;
        asset_id: string;
        bytes: number;
        created_at: string;
        daycare_id: string;
        delivery_type: Enums<"post_media_delivery_type">;
        feed_id: string;
        format: Enums<"post_media_format">;
        height: number;
        id: string;
        original_name: string;
        position: number;
        public_id: string;
        resource_type: Enums<"post_media_resource_type">;
        updated_at: string;
        width: number;
      }>;
      feed_overview: Table<{
        attendance: string;
        composer_prompt: string;
        created_at: string;
        date: string;
        daycare_id: string;
        greeting: string;
        id: string;
        published_today_label: string;
        room_label: string;
        updated_at: string;
      }>;
      feed_reactions: Table<{
        created_at: string;
        daycare_id: string;
        feed_id: string;
        id: string;
        person_id: string;
        type: Enums<"post_reaction_type">;
        updated_at: string;
      }>;
      invitation: Table<{
        accepted_at: string | null;
        code: string;
        created_at: string;
        daycare_id: string;
        expires_at: string;
        id: string;
        kid_id: string;
        person_id: string;
        relationship: Enums<"parent_relationship">;
        sent_at: string | null;
        updated_at: string;
      }>;
      kids: Table<{
        allergies: string;
        birth_date: string;
        created_at: string;
        daycare_id: string;
        enrollment_date: string;
        id: string;
        medical_notes: string;
        name: string;
        room_id: string;
        slug: string;
        status: Enums<"kid_status">;
        updated_at: string;
      }>;
      parent_kids: Table<{
        created_at: string;
        daycare_id: string;
        id: string;
        kid_id: string;
        parent_id: string;
        photo_sharing_consent: boolean;
        relationship: Enums<"parent_relationship">;
        updated_at: string;
      }>;
      people: Table<{
        created_at: string;
        daycare_id: string;
        email: string;
        id: string;
        name: string;
        role: Enums<"person_role">;
        status: Enums<"person_status">;
        updated_at: string;
      }>;
      rooms: Table<{
        created_at: string;
        daycare_id: string;
        id: string;
        name: string;
        updated_at: string;
      }>;
      staff_rooms: Table<{
        created_at: string;
        daycare_id: string;
        id: string;
        person_id: string;
        room_id: string;
        updated_at: string;
      }>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      kid_status: "active" | "inactive";
      parent_relationship: "mother" | "father" | "guardian";
      person_role: "parent" | "personal";
      person_status: "active" | "inactive" | "pending";
      post_media_delivery_type: "authenticated";
      post_media_format: "jpg" | "jpeg" | "png" | "webp";
      post_media_resource_type: "image";
      post_reaction_type: "love";
      post_type:
        | "food"
        | "nap"
        | "activity"
        | "achievement"
        | "mood"
        | "announcement";
    };
    CompositeTypes: Record<never, never>;
  };
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: readonly [];
};

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"];

export type Enums<
  EnumName extends keyof Database["public"]["Enums"],
> = Database["public"]["Enums"][EnumName];
