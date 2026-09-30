import type { Kid } from "@/src/domain/kid";
import type { Person } from "@/src/domain/person";
import type { Room } from "@/src/domain/room";

/** Relationship between a parent and a kid in the persisted data. */
export type ParentRelationship = "mother" | "father" | "guardian";

/** Persisted parent-to-kid relationship used by Kid queries. */
export type ParentKidRecord = {
  id: string;
  parentId: string;
  kidId: string;
  relationship: ParentRelationship;
  photoSharingConsent: boolean;
};

/** Persistence operations required by Kid commands and queries. */
export interface KidRepository {
  /** Lists all persisted kids. */
  findAll(): Promise<readonly Kid[]>;

  /** Finds a kid by its stable identifier. */
  findById(id: string): Promise<Kid | null>;

  /** Finds a kid by its public profile slug. */
  findBySlug(slug: string): Promise<Kid | null>;

  /** Persists a newly created kid. */
  create(kid: Kid): Promise<void>;

  /** Replaces an existing kid while preserving repository invariants. */
  update(kid: Kid): Promise<void>;
}

/** Persistence operations required to populate Kid room selectors and profiles. */
export interface RoomRepository {
  /** Lists all rooms available for assignment. */
  findAll(): Promise<readonly Room[]>;

  /** Finds a room by its stable identifier. */
  findById(id: string): Promise<Room | null>;
}

/** Persistence operations required to resolve linked parents. */
export interface PersonRepository {
  /** Lists people needed to resolve parent relationships. */
  findAll(): Promise<readonly Person[]>;
}

/** Persistence operations required to resolve parent-to-kid relationships. */
export interface ParentKidRepository {
  /** Lists all relationships used by the Kids list. */
  findAll(): Promise<readonly ParentKidRecord[]>;

  /** Lists relationships for a single kid profile. */
  findByKidId(kidId: string): Promise<readonly ParentKidRecord[]>;
}
