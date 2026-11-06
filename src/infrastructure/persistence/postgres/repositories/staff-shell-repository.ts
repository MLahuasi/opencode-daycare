import "server-only";

import type { PostgresQueryClient } from "../client/postgres-client";

/** PostgreSQL projection data required by the Staff Shell. */
export type StaffShellRow = {
  brandName: string;
  personName: string;
  jobTitle: string | null;
  roomNames: string[];
};

type StaffShellDatabaseRow = {
  brand_name: string;
  person_name: string;
  job_title: string | null;
  room_names: string[];
};

/** Reads tenant, person and assigned-room data for the Staff Shell. */
export class PostgresStaffShellRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  /**
   * Finds the Staff Shell projection inputs for one tenant-scoped person.
   *
   * @param daycareId - Tenant identifier.
   * @param personId - Person identifier within the tenant.
   * @returns Projection inputs, or null when the person is not in the tenant.
   */
  async findByPerson(
    daycareId: string,
    personId: string,
  ): Promise<StaffShellRow | null> {
    const rows = await this.client<StaffShellDatabaseRow[]>`
      SELECT
        d.brand_name,
        p.name AS person_name,
        p.job_title,
        COALESCE(
          array_agg(
            r.name
            ORDER BY CASE r.name
              WHEN 'Soles' THEN 1
              WHEN 'Girasoles' THEN 2
              WHEN 'Patitos' THEN 3
              ELSE 4
            END, r.name
          ) FILTER (WHERE r.id IS NOT NULL),
          ARRAY[]::text[]
        ) AS room_names
      FROM daycares AS d
      INNER JOIN people AS p
        ON p.daycare_id = d.id
      LEFT JOIN staff_rooms AS sr
        ON sr.daycare_id = p.daycare_id
       AND sr.person_id = p.id
      LEFT JOIN rooms AS r
        ON r.daycare_id = sr.daycare_id
       AND r.id = sr.room_id
      WHERE d.id = ${daycareId}
        AND p.id = ${personId}
      GROUP BY d.brand_name, p.name, p.job_title
      LIMIT 1
    `;

    const row = rows[0];
    return row
      ? {
          brandName: row.brand_name,
          personName: row.person_name,
          jobTitle: row.job_title,
          roomNames: row.room_names,
        }
      : null;
  }
}
