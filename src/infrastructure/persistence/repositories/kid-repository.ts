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
  /** @inheritdoc */
  findAll(): Promise<readonly Kid[]> {
    return readCollection<Kid>("kids.json");
  }

  /** @inheritdoc */
  async findById(id: string): Promise<Kid | null> {
    const kids = await this.findAll();

    return kids.find((kid) => kid.id === id) ?? null;
  }

  /** @inheritdoc */
  async findBySlug(slug: string): Promise<Kid | null> {
    const kids = await this.findAll();

    return kids.find((kid) => kid.slug === slug) ?? null;
  }

  /** @inheritdoc */
  create(kid: Kid): Promise<void> {
    return withWriteLock(async () => {
      const kids = await this.findAll();

      await writeCollection("kids.json", [...kids, kid]);
    });
  }

  /** @inheritdoc */
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
