import type { Person } from "@/src/domain/person";

/** Persistence operations required by Family invitation use cases. */
export interface FamilyPersonRepository {
  /**
   * Finds a person by its stable identifier.
   *
   * @param id - Stable person identifier.
   * @returns The person or `null` when it does not exist.
   */
  findById(id: string): Promise<Person | null>;

  /**
   * Finds a person by normalized email address.
   *
   * @param email - Normalized email address.
   * @returns The person or `null` when it does not exist.
   */
  findByEmail(email: string): Promise<Person | null>;

  /**
   * Persists a newly created pending person.
   *
   * @param person - Person record to persist.
   * @returns A promise that resolves after persistence completes.
   */
  create(person: Person): Promise<void>;

  /**
   * Replaces an existing person.
   *
   * @param person - Updated person record.
   * @returns A promise that resolves after persistence completes.
   */
  update(person: Person): Promise<void>;
}
