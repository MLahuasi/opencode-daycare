import "server-only";

import type { Room } from "@/domain/room";
import type { PostgresQueryClient } from "../client/postgres-client";
import { mapRoomRow } from "../mappers";
import type { Tables } from "../types";

/** PostgreSQL persistence adapter for daycare-scoped rooms. */
export class PostgresRoomRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  /** Lists every room belonging to the supplied daycare. */
  async findAll(daycareId: string): Promise<readonly Room[]> {
    const rows = await this.client<Tables<"rooms">[]>`
      SELECT daycare_id, id, name, created_at, updated_at
      FROM rooms
      WHERE daycare_id = ${daycareId}
      ORDER BY id
    `;

    return rows.map(mapRoomRow);
  }

  /** Finds a room by its composite daycare and room identifiers. */
  async findById(daycareId: string, id: string): Promise<Room | null> {
    const rows = await this.client<Tables<"rooms">[]>`
      SELECT daycare_id, id, name, created_at, updated_at
      FROM rooms
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
      LIMIT 1
    `;

    return rows[0] ? mapRoomRow(rows[0]) : null;
  }

  /** Inserts a room using the daycare and identifier supplied by the domain record. */
  async create(room: Room): Promise<void> {
    await this.client`
      INSERT INTO rooms (daycare_id, id, name)
      VALUES (${room.daycareId}, ${room.id}, ${room.name})
    `;
  }

  /** Replaces a room only when it belongs to the supplied daycare. */
  async update(room: Room): Promise<void> {
    const rows = await this.client<{ id: string }[]>`
      UPDATE rooms
      SET name = ${room.name},
          updated_at = now()
      WHERE daycare_id = ${room.daycareId}
        AND id = ${room.id}
      RETURNING id
    `;

    if (!rows[0]) {
      throw new Error(`Cannot update missing room: ${room.id}`);
    }
  }
}
