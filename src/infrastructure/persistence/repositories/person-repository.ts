import "server-only";

import type { FamilyPersonRepository } from "@/src/application/family/ports";
import type { PersonRepository as PersonRepositoryPort } from "@/src/application/kid/ports";
import type { Person } from "@/src/domain/person";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

/** JSON-backed persistence adapter for People. */
export class PersonRepository implements PersonRepositoryPort, FamilyPersonRepository {
  /**
   * Lists all persisted people.
   *
   * @returns All person records from JSON persistence.
   */
  findAll(): Promise<readonly Person[]> {
    return readCollection<Person>("people.json");
  }

  /**
   * Finds a person by stable identifier.
   *
   * @param id - Stable person identifier.
   * @returns The person or `null` when it does not exist.
   */
  async findById(id: string): Promise<Person | null> {
    const people = await this.findAll();

    return people.find((person) => person.id === id) ?? null;
  }

  /**
   * Finds a person by normalized email.
   *
   * @param email - Normalized email address.
   * @returns The person or `null` when it does not exist.
   */
  async findByEmail(email: string): Promise<Person | null> {
    const people = await this.findAll();

    return people.find((person) => person.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  /**
   * Persists a new person.
   *
   * @param person - Person record to append.
   * @returns A promise that resolves after persistence completes.
   */
  create(person: Person): Promise<void> {
    return withWriteLock(async () => {
      const people = await this.findAll();

      await writeCollection("people.json", [...people, person]);
    });
  }

  /**
   * Replaces an existing person.
   *
   * @param person - Updated person record.
   * @returns A promise that resolves after persistence completes.
   */
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
