import "server-only";

import type { Person } from "@/domain/person";
import { mapPersonRow } from "./mappers";
import type { PostgresClient } from "./postgres-client";
import type { Tables } from "./database.types";

/** PostgreSQL persistence adapter for daycare-scoped people. */
export class PostgresPersonRepository {
  public constructor(private readonly client: PostgresClient) {}

  /**
   * Lists the people belonging to one daycare.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @returns People persisted for the daycare.
   */
  async findAll(daycareId: string): Promise<readonly Person[]> {
    const rows = await this.client<Tables<"people">[]>`
      SELECT daycare_id, id, name, email, role, status, created_at, updated_at
      FROM people
      WHERE daycare_id = ${daycareId}
      ORDER BY id
    `;

    return rows.map(mapPersonRow);
  }

  /**
   * Finds a person by the composite daycare and person identifiers.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @param id - PostgreSQL person identifier.
   * @returns The person or `null` when it does not exist in the daycare.
   */
  async findById(daycareId: string, id: string): Promise<Person | null> {
    const rows = await this.client<Tables<"people">[]>`
      SELECT daycare_id, id, name, email, role, status, created_at, updated_at
      FROM people
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
      LIMIT 1
    `;

    return rows[0] ? mapPersonRow(rows[0]) : null;
  }

  /**
   * Finds a person by a daycare-scoped, case-insensitive email address.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @param email - Email address to match case-insensitively.
   * @returns The person or `null` when it does not exist in the daycare.
   */
  async findByEmail(daycareId: string, email: string): Promise<Person | null> {
    const rows = await this.client<Tables<"people">[]>`
      SELECT daycare_id, id, name, email, role, status, created_at, updated_at
      FROM people
      WHERE daycare_id = ${daycareId}
        AND lower(email) = lower(${email})
      LIMIT 1
    `;

    return rows[0] ? mapPersonRow(rows[0]) : null;
  }

  /**
   * Inserts a person using the PostgreSQL identifiers supplied by the domain
   * record. PostgreSQL IDs are intentionally not translated from JSON IDs.
   *
   * @param person - Person record to persist.
   */
  async create(person: Person): Promise<void> {
    await this.client`
      INSERT INTO people (daycare_id, id, name, email, role, status)
      VALUES (
        ${person.daycareId},
        ${person.id},
        ${person.name},
        ${person.email},
        ${person.role},
        ${person.status}
      )
    `;
  }

  /**
   * Replaces the mutable fields of a daycare-scoped person.
   *
   * @param person - Updated person record.
   * @throws Error when the person does not exist in the daycare.
   */
  async update(person: Person): Promise<void> {
    const rows = await this.client<{ id: string }[]>`
      UPDATE people
      SET name = ${person.name},
          email = ${person.email},
          role = ${person.role},
          status = ${person.status},
          updated_at = now()
      WHERE daycare_id = ${person.daycareId}
        AND id = ${person.id}
      RETURNING id
    `;

    if (rows.length === 0) {
      throw new Error(`Cannot update missing person: ${person.id}`);
    }
  }
}
