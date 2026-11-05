import type { ParentKid } from "@/domain/family";

/** Persistence operations required to manage parent-to-kid relationships. */
export interface ParentKidRepository {
  /** Lists all relationships used by the Kids list. */
  findAll(): Promise<readonly ParentKid[]>;

  /** Finds a relationship by its stable identifier. */
  findById(id: string): Promise<ParentKid | null>;

  /** Lists relationships for a single kid profile. */
  findByKidId(kidId: string): Promise<readonly ParentKid[]>;

  /** Persists a newly created relationship. */
  create(relationship: ParentKid): Promise<void>;

  /** Replaces an existing relationship. */
  update(relationship: ParentKid): Promise<void>;
}
