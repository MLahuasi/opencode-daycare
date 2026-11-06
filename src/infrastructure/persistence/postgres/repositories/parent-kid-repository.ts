import "server-only";

import type { ParentKid } from "@/domain/family";
import { mapParentKidRow } from "../mappers";
import type { PostgresQueryClient } from "../client/postgres-client";
import type { Tables } from "../types";

/** PostgreSQL persistence adapter for daycare-scoped parent-kid links. */
export class PostgresParentKidRepository {
  public constructor(private readonly client: PostgresQueryClient) {}

  async findAll(daycareId: string): Promise<readonly ParentKid[]> {
    const rows = await this.client<Tables<"parent_kids">[]>`
      SELECT daycare_id, id, parent_id, kid_id, relationship,
             photo_sharing_consent, created_at, updated_at
      FROM parent_kids
      WHERE daycare_id = ${daycareId}
      ORDER BY id
    `;

    return rows.map(mapParentKidRow);
  }

  async findById(daycareId: string, id: string): Promise<ParentKid | null> {
    const rows = await this.client<Tables<"parent_kids">[]>`
      SELECT daycare_id, id, parent_id, kid_id, relationship,
             photo_sharing_consent, created_at, updated_at
      FROM parent_kids
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
      LIMIT 1
    `;

    return rows[0] ? mapParentKidRow(rows[0]) : null;
  }

  async findByKidId(
    daycareId: string,
    kidId: string,
  ): Promise<readonly ParentKid[]> {
    const rows = await this.client<Tables<"parent_kids">[]>`
      SELECT daycare_id, id, parent_id, kid_id, relationship,
             photo_sharing_consent, created_at, updated_at
      FROM parent_kids
      WHERE daycare_id = ${daycareId}
        AND kid_id = ${kidId}
      ORDER BY id
    `;

    return rows.map(mapParentKidRow);
  }

  /** Lists relationships for a parent inside one daycare. */
  async findByParentId(
    daycareId: string,
    parentId: string,
  ): Promise<readonly ParentKid[]> {
    const rows = await this.client<Tables<"parent_kids">[]>`
      SELECT daycare_id, id, parent_id, kid_id, relationship,
             photo_sharing_consent, created_at, updated_at
      FROM parent_kids
      WHERE daycare_id = ${daycareId}
        AND parent_id = ${parentId}
      ORDER BY kid_id, id
    `;

    return rows.map(mapParentKidRow);
  }

  async findByParentAndKid(
    daycareId: string,
    parentId: string,
    kidId: string,
  ): Promise<ParentKid | null> {
    const rows = await this.client<Tables<"parent_kids">[]>`
      SELECT daycare_id, id, parent_id, kid_id, relationship,
             photo_sharing_consent, created_at, updated_at
      FROM parent_kids
      WHERE daycare_id = ${daycareId}
        AND parent_id = ${parentId}
        AND kid_id = ${kidId}
      LIMIT 1
    `;

    return rows[0] ? mapParentKidRow(rows[0]) : null;
  }

  async create(parentKid: ParentKid): Promise<void> {
    await this.client`
      INSERT INTO parent_kids (
        daycare_id, id, parent_id, kid_id, relationship, photo_sharing_consent
      )
      VALUES (
        ${parentKid.daycareId},
        ${parentKid.id},
        ${parentKid.parentId},
        ${parentKid.kidId},
        ${parentKid.relationship},
        ${parentKid.photoSharingConsent}
      )
    `;
  }

  async update(parentKid: ParentKid): Promise<void> {
    const rows = await this.client<{ id: string }[]>`
      UPDATE parent_kids
      SET parent_id = ${parentKid.parentId},
          kid_id = ${parentKid.kidId},
          relationship = ${parentKid.relationship},
          photo_sharing_consent = ${parentKid.photoSharingConsent},
          updated_at = now()
      WHERE daycare_id = ${parentKid.daycareId}
        AND id = ${parentKid.id}
      RETURNING id
    `;

    if (!rows[0]) {
      throw new Error(`Cannot update missing parent-kid relationship: ${parentKid.id}`);
    }
  }
}
