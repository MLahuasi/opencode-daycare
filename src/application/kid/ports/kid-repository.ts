import type { Kid } from "@/src/domain/kid";

/** Persistence operations required by Kid commands and queries. */
export interface KidRepository {
  /** Lists all persisted kids. */
  findAll(): Promise<readonly Kid[]>;

  /** Finds a kid by its stable identifier. */
  findById(id: string): Promise<Kid | null>;

  /** Finds a kid by its public profile slug. */
  findBySlug(slug: string): Promise<Kid | null>;

  /** Persists a newly created kid. */
  create(kid: Kid): Promise<void>;

  /** Replaces an existing kid while preserving repository invariants. */
  update(kid: Kid): Promise<void>;
}
