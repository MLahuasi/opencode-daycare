import "server-only";

import type { KidRepository as KidRepositoryPort } from "@/src/application/kid/ports";
import type { Kid } from "@/src/domain/kid";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

/** JSON-backed persistence adapter for Kids. */
export class KidRepository implements KidRepositoryPort {
  /**
   * Lists all persisted kids.
   *
   * @returns All kid records from JSON persistence.
   */
  findAll(): Promise<readonly Kid[]> {
    return readCollection<Kid>("kids.json");
  }

  /**
   * Finds a kid by stable identifier.
   *
   * @param id - Stable kid identifier.
   * @returns The kid or `null` when it does not exist.
   */
  async findById(id: string): Promise<Kid | null> {
    const kids = await this.findAll();

    return kids.find((kid) => kid.id === id) ?? null;
  }

  /**
   * Finds a kid by public profile slug.
   *
   * @param slug - Public kid profile slug.
   * @returns The kid or `null` when it does not exist.
   */
  async findBySlug(slug: string): Promise<Kid | null> {
    const kids = await this.findAll();

    return kids.find((kid) => kid.slug === slug) ?? null;
  }

  /**
   * Persists a new kid.
   *
   * @param kid - Kid record to append.
   * @returns A promise that resolves after persistence completes.
   */
  create(kid: Kid): Promise<void> {
    return withWriteLock(async () => {
      const kids = await this.findAll();

      await writeCollection("kids.json", [...kids, kid]);
    });
  }

  /**
   * Replaces an existing kid.
   *
   * @param kid - Updated kid record.
   * @returns A promise that resolves after persistence completes.
   */
  update(kid: Kid): Promise<void> {
    return withWriteLock(async () => {
      const kids = await this.findAll();
      const index = kids.findIndex((candidate) => candidate.id === kid.id);

      if (index === -1) {
        throw new Error(`Cannot update missing kid: ${kid.id}`);
      }

      const updatedKids = [...kids];
      updatedKids[index] = kid;
      await writeCollection("kids.json", updatedKids);
    });
  }
}
