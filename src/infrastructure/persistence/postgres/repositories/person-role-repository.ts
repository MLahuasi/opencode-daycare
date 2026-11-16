import "server-only";

import type { PersonRoles } from "@/domain/person";
import type { PostgresQueryClient } from "../client/postgres-client";
import type { Tables } from "../types";

type PersonRoleRow = Pick<Tables<"roles">, "code">;

/** PostgreSQL adapter for tenant-scoped roles assigned to a person. */
export class PostgresPersonRoleRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  /**
   * Resolves the roles assigned to a person in one daycare.
   *
   * @param personId - PostgreSQL person identifier.
   * @param daycareId - PostgreSQL daycare identifier.
   * @returns The role codes assigned to the person in that daycare.
   */
  async findByPersonAndDaycare(
    personId: string,
    daycareId: string,
  ): Promise<PersonRoles> {
    const rows = await this.client<PersonRoleRow[]>`
      SELECT r.code
      FROM people_roles AS pr
      INNER JOIN roles AS r ON r.id = pr.role_id
      WHERE pr.person_id = ${personId}
        AND pr.daycare_id = ${daycareId}
      ORDER BY r.code
    `;

    return rows.map((row) => row.code);
  }
}
