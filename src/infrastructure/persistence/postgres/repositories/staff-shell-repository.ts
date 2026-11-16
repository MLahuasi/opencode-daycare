import "server-only";

import type { StaffShellReader, StaffShellRecord } from "@/application/staff";
import type { PostgresQueryClient } from "../client/postgres-client";

type StaffShellRow = {
  brand_name: string;
  person_name: string;
  job_title: string | null;
  room_name: string | null;
};

/** PostgreSQL adapter for the tenant-scoped Staff Shell projection source. */
export class PostgresStaffShellRepository implements StaffShellReader {
  public constructor(private readonly client: PostgresQueryClient) {}

  /**
   * Reads daycare branding, profile data and assigned rooms for a person.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @param personId - PostgreSQL person identifier.
   * @returns Staff Shell source data, or `null` when the person is absent.
   */
  async findByPerson(
    daycareId: string,
    personId: string,
  ): Promise<StaffShellRecord | null> {
    const rows = await this.client<StaffShellRow[]>`
      SELECT
        d.brand_name,
        p.name AS person_name,
        p.job_title,
        r.name AS room_name
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
      ORDER BY r.name NULLS LAST
    `;

    const first = rows[0];
    if (!first) return null;

    return {
      brandName: first.brand_name,
      personName: first.person_name,
      jobTitle: first.job_title,
      roomNames: rows.flatMap((row) =>
        row.room_name ? [row.room_name] : [],
      ),
    };
  }
}
