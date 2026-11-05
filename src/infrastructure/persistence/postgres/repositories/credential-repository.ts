import "server-only";

import type { Credential } from "@/domain/auth";
import { mapCredentialRow } from "../mappers";
import type { PostgresQueryClient } from "../client/postgres-client";
import type { Tables } from "../types";

/** PostgreSQL persistence adapter for daycare-scoped credentials. */
export class PostgresCredentialRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  /**
   * Finds a credential using both tenant and person identifiers.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @param personId - PostgreSQL person identifier.
   * @returns The credential or `null` when it does not exist in the daycare.
   */
  async findByPersonId(
    daycareId: string,
    personId: string,
  ): Promise<Credential | null> {
    const rows = await this.client<Tables<"credential">[]>`
      SELECT daycare_id, id, person_id, password_hash, created_at, updated_at
      FROM credential
      WHERE daycare_id = ${daycareId}
        AND person_id = ${personId}
      LIMIT 1
    `;

    return rows[0] ? mapCredentialRow(rows[0]) : null;
  }

  /**
   * Creates or replaces a credential while serializing writes for its person.
   * The person row lock prevents concurrent upserts for the same tenant and
   * person from both observing a missing credential.
   *
   * @param credential - Credential record to persist.
   * @throws Error when the credential's person does not exist in the daycare.
   */
  async upsert(credential: Credential): Promise<void> {
    await this.client.begin(async (transaction) => {
      const people = await transaction<{ id: string }[]>`
        SELECT id
        FROM people
        WHERE daycare_id = ${credential.daycareId}
          AND id = ${credential.personId}
        FOR UPDATE
      `;

      if (people.length === 0) {
        throw new Error(`Cannot persist credential for missing person: ${credential.personId}`);
      }

      const updatedRows = await transaction<Tables<"credential">[]>`
        UPDATE credential
        SET password_hash = ${credential.passwordHash},
            updated_at = now()
        WHERE daycare_id = ${credential.daycareId}
          AND person_id = ${credential.personId}
        RETURNING daycare_id, id, person_id, password_hash, created_at, updated_at
      `;

      if (updatedRows.length > 0) {
        return;
      }

      await transaction`
        INSERT INTO credential (daycare_id, id, person_id, password_hash)
        VALUES (
          ${credential.daycareId},
          ${credential.id},
          ${credential.personId},
          ${credential.passwordHash}
        )
      `;
    });
  }
}
