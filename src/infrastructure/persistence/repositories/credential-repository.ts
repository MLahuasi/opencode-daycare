import "server-only";

import type { CredentialRepository as CredentialRepositoryPort } from "@/src/application/auth/ports";
import type { Credential } from "@/src/domain/auth";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

/** JSON-backed persistence adapter for Auth credentials. */
export class CredentialRepository implements CredentialRepositoryPort {
  /**
   * Finds a credential by person identifier.
   *
   * @param personId - Stable person identifier.
   * @returns The credential or `null` when it does not exist.
   */
  async findByPersonId(personId: string): Promise<Credential | null> {
    const credentials = await readCollection<Credential>("credential.json");

    return credentials.find((credential) => credential.personId === personId) ?? null;
  }

  /**
   * Creates or replaces a person's credential.
   *
   * @param credential - Credential record to persist.
   * @returns A promise that resolves after persistence completes.
   */
  upsert(credential: Credential): Promise<void> {
    return withWriteLock(async () => {
      const credentials = await readCollection<Credential>("credential.json");
      const updatedCredentials = [
        ...credentials.filter((candidate) => candidate.personId !== credential.personId),
        credential,
      ];

      await writeCollection("credential.json", updatedCredentials);
    });
  }
}
