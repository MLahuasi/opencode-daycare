import "server-only";

import type { Person } from "@/domain/person";
import { mapPersonRow, type PersonRow } from "../mappers";
import type { PostgresQueryClient } from "../client/postgres-client";

/** PostgreSQL persistence adapter for daycare-scoped people. */
export class PostgresPersonRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  /**
   * Lists the people belonging to one daycare.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @returns People persisted for the daycare.
   */
  async findAll(daycareId: string): Promise<readonly Person[]> {
    const rows = await this.client<PersonRow[]>`
      SELECT p.daycare_id, p.id, p.name, p.email, p.job_title, p.status,
             p.created_at, p.updated_at,
             coalesce(
               array_agg(r.code ORDER BY r.code)
                 FILTER (WHERE r.code IS NOT NULL),
               '{}'
             ) AS roles
      FROM people AS p
      LEFT JOIN people_roles AS pr
        ON pr.daycare_id = p.daycare_id
       AND pr.person_id = p.id
      LEFT JOIN roles AS r ON r.id = pr.role_id
      WHERE p.daycare_id = ${daycareId}
      GROUP BY p.daycare_id, p.id, p.name, p.email, p.job_title,
               p.status, p.created_at, p.updated_at
      ORDER BY p.id
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
    const rows = await this.client<PersonRow[]>`
      SELECT p.daycare_id, p.id, p.name, p.email, p.job_title, p.status,
             p.created_at, p.updated_at,
             coalesce(
               array_agg(r.code ORDER BY r.code)
                 FILTER (WHERE r.code IS NOT NULL),
               '{}'
             ) AS roles
      FROM people AS p
      LEFT JOIN people_roles AS pr
        ON pr.daycare_id = p.daycare_id
       AND pr.person_id = p.id
      LEFT JOIN roles AS r ON r.id = pr.role_id
      WHERE p.daycare_id = ${daycareId}
        AND p.id = ${id}
      GROUP BY p.daycare_id, p.id, p.name, p.email, p.job_title,
               p.status, p.created_at, p.updated_at
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
    const rows = await this.client<PersonRow[]>`
      SELECT p.daycare_id, p.id, p.name, p.email, p.job_title, p.status,
             p.created_at, p.updated_at,
             coalesce(
               array_agg(r.code ORDER BY r.code)
                 FILTER (WHERE r.code IS NOT NULL),
               '{}'
             ) AS roles
      FROM people AS p
      LEFT JOIN people_roles AS pr
        ON pr.daycare_id = p.daycare_id
       AND pr.person_id = p.id
      LEFT JOIN roles AS r ON r.id = pr.role_id
      WHERE p.daycare_id = ${daycareId}
        AND lower(p.email) = lower(${email})
      GROUP BY p.daycare_id, p.id, p.name, p.email, p.job_title,
               p.status, p.created_at, p.updated_at
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
    await this.client.begin(async (transaction) => {
      await transaction`
      INSERT INTO people (daycare_id, id, name, email, status)
      VALUES (
        ${person.daycareId},
        ${person.id},
        ${person.name},
        ${person.email},
        ${person.status}
      )
      `;

      if (person.roles.length > 0) {
        await transaction`
          INSERT INTO people_roles (daycare_id, person_id, role_id)
          SELECT ${person.daycareId}, ${person.id}, id
          FROM roles
          WHERE code IN ${transaction(person.roles)}
        `;
      }
    });
  }

  /**
   * Replaces the mutable fields of a daycare-scoped person.
   *
   * @param person - Updated person record.
   * @throws Error when the person does not exist in the daycare.
   */
  async update(person: Person): Promise<void> {
    const rows = await this.client.begin(async (transaction) => {
      const updated = await transaction<{ id: string }[]>`
        UPDATE people
        SET name = ${person.name},
            email = ${person.email},
            status = ${person.status},
            updated_at = now()
        WHERE daycare_id = ${person.daycareId}
          AND id = ${person.id}
        RETURNING id
      `;

      if (updated.length > 0) {
        await transaction`
          DELETE FROM people_roles
          WHERE daycare_id = ${person.daycareId}
            AND person_id = ${person.id}
        `;
        if (person.roles.length > 0) {
          await transaction`
            INSERT INTO people_roles (daycare_id, person_id, role_id)
            SELECT ${person.daycareId}, ${person.id}, id
            FROM roles
            WHERE code IN ${transaction(person.roles)}
          `;
        }
      }

      return updated;
    });

    if (rows.length === 0) {
      throw new Error(`Cannot update missing person: ${person.id}`);
    }
  }
}
