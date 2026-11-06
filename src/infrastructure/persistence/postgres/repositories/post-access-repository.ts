import "server-only";

import type { CurrentDaycareReader } from "@/application/daycare/ports";
import type { PostAccessRepository } from "@/application/post/ports";
import type { Kid } from "@/domain/kid";
import type { PostgresQueryClient } from "../client/postgres-client";
import {
  mapKidRow,
  mapParentKidRow,
  mapStaffRoomRow,
} from "../mappers";
import type { Tables } from "../types";

/** PostgreSQL access adapter used by Staff Post authorization. */
export class PostgresPostAccessRepository implements PostAccessRepository {
  public constructor(
    private readonly client: PostgresQueryClient,
    private readonly currentDaycare: CurrentDaycareReader,
  ) {}

  /** Lists room identifiers assigned to a staff member in the current daycare. */
  async findStaffRoomIds(personId: string): Promise<readonly string[]> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<Tables<"staff_rooms">[]>`
      SELECT daycare_id, id, person_id, room_id, created_at, updated_at
      FROM staff_rooms
      WHERE daycare_id = ${daycareId}
        AND person_id = ${personId}
      ORDER BY room_id
    `;

    return rows.map(mapStaffRoomRow).map((assignment) => assignment.roomId);
  }

  /** Lists kid identifiers linked to a parent in the current daycare. */
  async findParentKidIds(personId: string): Promise<readonly string[]> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<Tables<"parent_kids">[]>`
      SELECT daycare_id, id, parent_id, kid_id, relationship,
             photo_sharing_consent, created_at, updated_at
      FROM parent_kids
      WHERE daycare_id = ${daycareId}
        AND parent_id = ${personId}
      ORDER BY kid_id
    `;

    return rows.map(mapParentKidRow).map((relationship) => relationship.kidId);
  }

  /** Finds a kid only when its row belongs to the current daycare. */
  async findKidById(id: string): Promise<Kid | null> {
    const daycareId = await this.currentDaycare.getCurrentDaycareId();
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

  /** Lists active kids from the current daycare matching the supplied identifiers. */
  async findActiveKidsByIds(ids: readonly string[]): Promise<readonly Kid[]> {
    if (ids.length === 0) {
      return [];
    }

    const daycareId = await this.currentDaycare.getCurrentDaycareId();
    const rows = await this.client<Tables<"kids">[]>`
      SELECT daycare_id, id, slug, name, birth_date, room_id,
             enrollment_date, medical_notes, allergies, status,
             created_at, updated_at
      FROM kids
      WHERE daycare_id = ${daycareId}
        AND status = 'active'
        AND id IN ${this.client(ids)}
      ORDER BY id
    `;

    return rows.map(mapKidRow);
  }
}

/** Backward-compatible name describing this adapter's Staff authorization role. */
export { PostgresPostAccessRepository as PostgresStaffAccessRepository };
