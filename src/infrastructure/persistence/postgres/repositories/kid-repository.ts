import "server-only";

import type { Kid } from "@/domain/kid";
import type { PostgresQueryClient } from "../client/postgres-client";
import { mapKidRow } from "../mappers";
import type { Tables } from "../types";

/** PostgreSQL persistence adapter for daycare-scoped kids. */
export class PostgresKidRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  /** Lists every kid belonging to the supplied daycare. */
  async findAll(daycareId: string): Promise<readonly Kid[]> {
    const rows = await this.client<Tables<"kids">[]>`
      SELECT daycare_id, id, slug, name, birth_date, room_id,
             enrollment_date, medical_notes, allergies, status,
             created_at, updated_at
      FROM kids
      WHERE daycare_id = ${daycareId}
      ORDER BY id
    `;

    return rows.map(mapKidRow);
  }

  /** Finds a kid by its composite daycare and kid identifiers. */
  async findById(daycareId: string, id: string): Promise<Kid | null> {
    const rows = await this.client<Tables<"kids">[]>`
      SELECT daycare_id, id, slug, name, birth_date, room_id,
             enrollment_date, medical_notes, allergies, status,
             created_at, updated_at
      FROM kids
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
      LIMIT 1
    `;

    return rows[0] ? mapKidRow(rows[0]) : null;
  }

  /** Finds a kid by a daycare-scoped public profile slug. */
  async findBySlug(daycareId: string, slug: string): Promise<Kid | null> {
    const rows = await this.client<Tables<"kids">[]>`
      SELECT daycare_id, id, slug, name, birth_date, room_id,
             enrollment_date, medical_notes, allergies, status,
             created_at, updated_at
      FROM kids
      WHERE daycare_id = ${daycareId}
        AND slug = ${slug}
      LIMIT 1
    `;

    return rows[0] ? mapKidRow(rows[0]) : null;
  }

  /** Lists only kids whose rooms are included in the supplied authorization scope. */
  async findAllInRooms(
    daycareId: string,
    roomIds: readonly string[],
  ): Promise<readonly Kid[]> {
    if (roomIds.length === 0) return [];

    const rows = await this.client<Tables<"kids">[]>`
      SELECT daycare_id, id, slug, name, birth_date, room_id,
             enrollment_date, medical_notes, allergies, status,
             created_at, updated_at
      FROM kids
      WHERE daycare_id = ${daycareId}
        AND room_id IN ${this.client(roomIds)}
      ORDER BY id
    `;

    return rows.map(mapKidRow);
  }

  /** Finds a kid only when its room is included in the authorization scope. */
  async findByIdInRooms(
    daycareId: string,
    id: string,
    roomIds: readonly string[],
  ): Promise<Kid | null> {
    if (roomIds.length === 0) return null;

    const rows = await this.client<Tables<"kids">[]>`
      SELECT daycare_id, id, slug, name, birth_date, room_id,
             enrollment_date, medical_notes, allergies, status,
             created_at, updated_at
      FROM kids
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
        AND room_id IN ${this.client(roomIds)}
      LIMIT 1
    `;

    return rows[0] ? mapKidRow(rows[0]) : null;
  }

  /** Finds a slug only when its room is included in the authorization scope. */
  async findBySlugInRooms(
    daycareId: string,
    slug: string,
    roomIds: readonly string[],
  ): Promise<Kid | null> {
    if (roomIds.length === 0) return null;

    const rows = await this.client<Tables<"kids">[]>`
      SELECT daycare_id, id, slug, name, birth_date, room_id,
             enrollment_date, medical_notes, allergies, status,
             created_at, updated_at
      FROM kids
      WHERE daycare_id = ${daycareId}
        AND slug = ${slug}
        AND room_id IN ${this.client(roomIds)}
      LIMIT 1
    `;

    return rows[0] ? mapKidRow(rows[0]) : null;
  }

  /** Inserts a kid using the daycare and identifier supplied by the domain record. */
  async create(kid: Kid): Promise<void> {
    await this.client`
      INSERT INTO kids (
        daycare_id, id, slug, name, birth_date, room_id,
        enrollment_date, medical_notes, allergies, status
      )
      VALUES (
        ${kid.daycareId}, ${kid.id}, ${kid.slug}, ${kid.name},
        ${kid.birthDate}, ${kid.roomId}, ${kid.enrollmentDate},
        ${kid.medicalNotes}, ${kid.allergies}, ${kid.status}
      )
    `;
  }

  /** Replaces mutable kid fields only within the kid's daycare. */
  async update(kid: Kid): Promise<void> {
    const rows = await this.client<{ id: string }[]>`
      UPDATE kids
      SET slug = ${kid.slug},
          name = ${kid.name},
          birth_date = ${kid.birthDate},
          room_id = ${kid.roomId},
          enrollment_date = ${kid.enrollmentDate},
          medical_notes = ${kid.medicalNotes},
          allergies = ${kid.allergies},
          status = ${kid.status},
          updated_at = now()
      WHERE daycare_id = ${kid.daycareId}
        AND id = ${kid.id}
      RETURNING id
    `;

    if (!rows[0]) {
      throw new Error(`Cannot update missing kid: ${kid.id}`);
    }
  }
}
