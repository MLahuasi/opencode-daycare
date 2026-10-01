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

/** Persistence operations required to manage parent-to-kid relationships. */
export interface ParentKidRepository {
  /** Lists all relationships used by the Kids list. */
  findAll(): Promise<readonly ParentKidRecord[]>;

  /** Finds a relationship by its stable identifier. */
  findById(id: string): Promise<ParentKidRecord | null>;

  /** Lists relationships for a single kid profile. */
  findByKidId(kidId: string): Promise<readonly ParentKidRecord[]>;

  /** Persists a newly created relationship. */
  create(relationship: ParentKidRecord): Promise<void>;

  /** Replaces an existing relationship. */
  update(relationship: ParentKidRecord): Promise<void>;
}
