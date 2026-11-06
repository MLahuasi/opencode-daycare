import "server-only";

import type { PersonRoleReader } from "@/application/person";
import type { PostgresQueryClient } from "../client/postgres-client";
import type { Enums } from "../types";

type PersonRoleRow = {
  code: Enums<"person_role">;
};

/** PostgreSQL reader for tenant-scoped person roles. */
export class PostgresPersonRoleRepository implements PersonRoleReader {
  public constructor(private readonly client: PostgresQueryClient) {}

  /**
   * Reads roles through the tenant-scoped people_roles bridge.
   *
   * @param personId - Stable person identifier.
   * @param daycareId - Stable daycare identifier.
   * @returns Role codes assigned to the person in the requested daycare.
   */
  async findRoles(
    personId: string,
    daycareId: string,
  ): Promise<readonly Enums<"person_role">[]> {
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
