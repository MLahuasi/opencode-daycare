import type { Person } from "@/src/domain/person";

/** Persistence operations required to manage people. */
export interface PersonRepository {
  /** Lists all people needed to resolve parent relationships. */
  findAll(): Promise<readonly Person[]>;

  /** Finds a person by its stable identifier. */
  findById(id: string): Promise<Person | null>;

  /** Persists a newly created person. */
  create(person: Person): Promise<void>;

  /** Replaces an existing person. */
  update(person: Person): Promise<void>;
}
