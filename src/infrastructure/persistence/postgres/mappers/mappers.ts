import type { Credential } from "@/domain/auth";
import type { Invitation, ParentKid } from "@/domain/family";
import type { Kid } from "@/domain/kid";
import type { Person } from "@/domain/person";
import type { PostComment, PostMedia, PostReaction, PersistedPost } from "@/domain/post";
import type { Room } from "@/domain/room";
import { getApplicationEnvironment } from "@/config/server";
import type { Tables } from "../types/database.types";

/** Staff-to-room assignment used by staff authorization adapters. */
export type StaffRoom = {
  daycareId: string;
  personId: string;
  roomId: string;
};

function toIsoDateOnly(value: unknown): string {
  if (!(value instanceof Date)) return String(value);

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: getApplicationEnvironment().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const parts = Object.fromEntries(
    dateParts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Maps a PostgreSQL people row to the Person domain entity. */
export function mapPersonRow(row: Tables<"people">): Person {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
  };
}

/** Maps a PostgreSQL credential row to the Credential domain entity. */
export function mapCredentialRow(row: Tables<"credential">): Credential {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    personId: row.person_id,
    passwordHash: row.password_hash,
  };
}

/** Maps a PostgreSQL invitation row to the Invitation domain entity. */
export function mapInvitationRow(row: Tables<"invitation">): Invitation {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    personId: row.person_id,
    kidId: row.kid_id,
    relationship: row.relationship,
    code: row.code,
    expiresAt: row.expires_at,
    sentAt: row.sent_at,
    acceptedAt: row.accepted_at,
  };
}

/** Maps a PostgreSQL rooms row to the Room domain entity. */
export function mapRoomRow(row: Tables<"rooms">): Room {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    name: row.name,
  };
}

/** Maps a PostgreSQL kids row to the Kid domain entity. */
export function mapKidRow(row: Tables<"kids">): Kid {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    slug: row.slug,
    name: row.name,
    birthDate: toIsoDateOnly(row.birth_date),
    roomId: row.room_id,
    enrollmentDate: toIsoDateOnly(row.enrollment_date),
    medicalNotes: row.medical_notes,
    allergies: row.allergies,
    status: row.status,
  };
}

/** Maps a PostgreSQL parent_kids row to the ParentKid domain entity. */
export function mapParentKidRow(row: Tables<"parent_kids">): ParentKid {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    parentId: row.parent_id,
    kidId: row.kid_id,
    relationship: row.relationship,
    photoSharingConsent: row.photo_sharing_consent,
  };
}

/** Maps a PostgreSQL staff_rooms row to a staff room assignment. */
export function mapStaffRoomRow(row: Tables<"staff_rooms">): StaffRoom {
  return {
    daycareId: row.daycare_id,
    personId: row.person_id,
    roomId: row.room_id,
  };
}

/** Related data required to rebuild the normalized feed collections. */
export type FeedRelations = {
  kidIds?: readonly string[];
  media?: readonly PostMedia[];
};

/** Maps a PostgreSQL feed row and normalized relations to a Post entity. */
export function mapFeedRow(
  row: Tables<"feed">,
  relations: FeedRelations = {},
): PersistedPost {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    type: row.type,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    body: row.body,
    media: [...(relations.media ?? [])],
    kidIds: [...(relations.kidIds ?? [])],
    roomId: row.room_id,
  };
}

/** Maps a PostgreSQL feed_media row to the PostMedia domain entity. */
export function mapFeedMediaRow(row: Tables<"feed_media">): PostMedia {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    publicId: row.public_id,
    assetId: row.asset_id,
    resourceType: row.resource_type,
    deliveryType: row.delivery_type,
    format: row.format,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    originalName: row.original_name,
    alt: row.alt,
  };
}

/** Maps a PostgreSQL feed_comments row to the PostComment domain entity. */
export function mapFeedCommentRow(row: Tables<"feed_comments">): PostComment {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    postId: row.feed_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Maps a PostgreSQL feed_reactions row to the PostReaction domain entity. */
export function mapFeedReactionRow(row: Tables<"feed_reactions">): PostReaction {
  return {
    daycareId: row.daycare_id,
    id: row.id,
    postId: row.feed_id,
    personId: row.person_id,
    type: row.type,
    createdAt: row.created_at,
  };
}
