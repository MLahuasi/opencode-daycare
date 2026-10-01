import "server-only";

import type { FamilyParentKidRepository } from "@/src/application/family/ports";
import type {
  ParentKidRecord,
  ParentKidRepository as ParentKidRepositoryPort,
} from "@/src/application/kid/ports";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

/** JSON-backed persistence adapter for parent-to-kid relationships. */
export class ParentKidRepository implements ParentKidRepositoryPort, FamilyParentKidRepository {
  /**
   * Lists all persisted parent-kid relationships.
   *
   * @returns All relationship records from JSON persistence.
   */
  findAll(): Promise<readonly ParentKidRecord[]> {
    return readCollection<ParentKidRecord>("parent-kids.json");
  }

  /**
   * Lists relationships for a kid.
   *
   * @param kidId - Stable kid identifier.
   * @returns Relationships associated with the kid.
   */
  async findByKidId(kidId: string): Promise<readonly ParentKidRecord[]> {
    const relationships = await this.findAll();

    return relationships.filter((relationship) => relationship.kidId === kidId);
  }

  /**
   * Finds a relationship by stable identifier.
   *
   * @param id - Stable relationship identifier.
   * @returns The relationship or `null` when it does not exist.
   */
  async findById(id: string): Promise<ParentKidRecord | null> {
    const relationships = await this.findAll();

    return relationships.find((relationship) => relationship.id === id) ?? null;
  }

  /**
   * Finds a relationship for a parent and kid pair.
   *
   * @param parentId - Stable parent identifier.
   * @param kidId - Stable kid identifier.
   * @returns The relationship or `null` when it does not exist.
   */
  async findByParentAndKid(parentId: string, kidId: string): Promise<ParentKidRecord | null> {
    const relationships = await this.findAll();

    return relationships.find(
      (relationship) =>
        relationship.parentId === parentId && relationship.kidId === kidId,
    ) ?? null;
  }

  /**
   * Persists a new parent-kid relationship.
   *
   * @param relationship - Relationship record to append.
   * @returns A promise that resolves after persistence completes.
   */
  create(relationship: ParentKidRecord): Promise<void> {
    return withWriteLock(async () => {
      const relationships = await this.findAll();

      await writeCollection("parent-kids.json", [...relationships, relationship]);
    });
  }

  /**
   * Replaces an existing parent-kid relationship.
   *
   * @param relationship - Updated relationship record.
   * @returns A promise that resolves after persistence completes.
   */
  update(relationship: ParentKidRecord): Promise<void> {
    return withWriteLock(async () => {
      const relationships = await this.findAll();
      const index = relationships.findIndex(
        (candidate) => candidate.id === relationship.id,
      );

      if (index === -1) {
        throw new Error(`Cannot update missing parent-kid relationship: ${relationship.id}`);
      }

      const updatedRelationships = [...relationships];
      updatedRelationships[index] = relationship;
      await writeCollection("parent-kids.json", updatedRelationships);
    });
  }
}
