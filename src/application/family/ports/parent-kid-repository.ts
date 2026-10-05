import type { ParentKid } from "@/domain/family";

/** Persistence operations required by Family relationship use cases. */
export interface FamilyParentKidRepository {
  /**
   * Finds a relationship for a parent and kid pair.
   *
   * @param parentId - Stable parent person identifier.
   * @param kidId - Stable kid identifier.
   * @returns The relationship or `null` when it does not exist.
   */
  findByParentAndKid(parentId: string, kidId: string): Promise<ParentKid | null>;

  /**
   * Persists a newly accepted parent-kid relationship.
   *
   * @param parentKid - Relationship record to persist.
   * @returns A promise that resolves after persistence completes.
   */
  create(parentKid: ParentKid): Promise<void>;
}
