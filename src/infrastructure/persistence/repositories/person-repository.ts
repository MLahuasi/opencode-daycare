import "server-only";

import type { PersonRepository as PersonRepositoryPort } from "@/src/application/kid/ports";
import type { Person } from "@/src/domain/person";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

/** JSON-backed persistence adapter for People. */
export class PersonRepository implements PersonRepositoryPort {
  /** @inheritdoc */
  findAll(): Promise<readonly Person[]> {
    return readCollection<Person>("people.json");
  }

  /** @inheritdoc */
  async findById(id: string): Promise<Person | null> {
    const people = await this.findAll();

    return people.find((person) => person.id === id) ?? null;
  }

  /** @inheritdoc */
  create(person: Person): Promise<void> {
    return withWriteLock(async () => {
      const people = await this.findAll();

      await writeCollection("people.json", [...people, person]);
    });
  }

  /** @inheritdoc */
  update(person: Person): Promise<void> {
    return withWriteLock(async () => {
      const people = await this.findAll();
      const index = people.findIndex((candidate) => candidate.id === person.id);

      if (index === -1) {
        throw new Error(`Cannot update missing person: ${person.id}`);
      }

      const updatedPeople = [...people];
      updatedPeople[index] = person;
      await writeCollection("people.json", updatedPeople);
    });
  }
}
