import type { Credential } from "@/src/domain/auth";

/** Persistence operations required by Auth credential use cases. */
export interface CredentialRepository {
  /**
   * Finds a credential by its person identifier.
   *
   * @param personId - Stable person identifier.
   * @returns The credential or `null` when none exists.
   */
  findByPersonId(personId: string): Promise<Credential | null>;

  /**
   * Creates or replaces the credential for a person.
   *
   * @param credential - Credential record to persist.
   * @returns A promise that resolves after persistence completes.
   */
  upsert(credential: Credential): Promise<void>;
}
