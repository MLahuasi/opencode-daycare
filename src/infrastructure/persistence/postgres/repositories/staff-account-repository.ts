import "server-only";

import type {
  StaffAccount,
  StaffAccountRepository,
  UpdateStaffAccountInput,
} from "@/application/staff";
import type { PostgresQueryClient } from "../client/postgres-client";

type StaffAccountRow = {
  daycare_id: string;
  person_id: string;
  person_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  room_name: string | null;
};

/** PostgreSQL adapter for the tenant-scoped staff account. */
export class PostgresStaffAccountRepository implements StaffAccountRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  /** Reads the authenticated person's account and assigned rooms. */
  async findByPerson(
    daycareId: string,
    personId: string,
  ): Promise<StaffAccount | null> {
    const rows = await this.client<StaffAccountRow[]>`
      SELECT
        p.daycare_id,
        p.id AS person_id,
        p.name AS person_name,
        p.email,
        p.phone,
        p.job_title,
        r.name AS room_name
      FROM people AS p
      LEFT JOIN staff_rooms AS sr
        ON sr.daycare_id = p.daycare_id
       AND sr.person_id = p.id
      LEFT JOIN rooms AS r
        ON r.daycare_id = sr.daycare_id
       AND r.id = sr.room_id
      WHERE p.daycare_id = ${daycareId}
        AND p.id = ${personId}
      ORDER BY r.name NULLS LAST
    `;

    const first = rows[0];
    if (!first) return null;

    return {
      daycareId: first.daycare_id,
      personId: first.person_id,
      name: first.person_name,
      email: first.email,
      phone: first.phone,
      jobTitle: first.job_title,
      roomNames: rows.flatMap((row) =>
        row.room_name ? [row.room_name] : [],
      ),
    };
  }

  /** Updates only name and phone for the tenant-scoped person. */
  async updateProfile(
    daycareId: string,
    personId: string,
    input: UpdateStaffAccountInput,
  ): Promise<void> {
    const rows = await this.client<{ id: string }[]>`
      UPDATE people
      SET name = ${input.name},
          phone = ${input.phone},
          updated_at = now()
      WHERE daycare_id = ${daycareId}
        AND id = ${personId}
      RETURNING id
    `;

    if (rows.length === 0) {
      throw new Error("Cannot update missing staff account.");
    }
  }
}
