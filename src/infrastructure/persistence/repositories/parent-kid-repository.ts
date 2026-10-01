import "server-only";

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
export class ParentKidRepository implements ParentKidRepositoryPort {
  /** @inheritdoc */
  findAll(): Promise<readonly ParentKidRecord[]> {
    return readCollection<ParentKidRecord>("parent-kids.json");
  }

  /** @inheritdoc */
  async findByKidId(kidId: string): Promise<readonly ParentKidRecord[]> {
    const relationships = await this.findAll();

    return relationships.filter((relationship) => relationship.kidId === kidId);
  }

  /** @inheritdoc */
  async findById(id: string): Promise<ParentKidRecord | null> {
    const relationships = await this.findAll();

    return relationships.find((relationship) => relationship.id === id) ?? null;
  }

  /** @inheritdoc */
  create(relationship: ParentKidRecord): Promise<void> {
    return withWriteLock(async () => {
      const relationships = await this.findAll();

      await writeCollection("parent-kids.json", [...relationships, relationship]);
    });
  }

  /** @inheritdoc */
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
