import "server-only";

import type { Invitation } from "@/domain/family";
import { mapInvitationRow } from "./mappers";
import type { PostgresClient } from "./postgres-client";
import type { Tables } from "./database.types";

/** PostgreSQL persistence adapter for daycare-scoped invitations. */
export class PostgresInvitationRepository {
  public constructor(private readonly client: PostgresClient) {}

  /**
   * Lists the invitations belonging to one daycare.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @returns Invitations persisted for the daycare.
   */
  async findAll(daycareId: string): Promise<readonly Invitation[]> {
    const rows = await this.client<Tables<"invitation">[]>`
      SELECT daycare_id, id, person_id, kid_id, relationship, code,
             expires_at, sent_at, accepted_at, created_at, updated_at
      FROM invitation
      WHERE daycare_id = ${daycareId}
      ORDER BY id
    `;

    return rows.map(mapInvitationRow);
  }

  /**
   * Finds an invitation by its tenant-scoped token.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @param code - Invitation token to find.
   * @returns The invitation or `null` when it is not in the daycare.
   */
  async findByCode(daycareId: string, code: string): Promise<Invitation | null> {
    const rows = await this.client<Tables<"invitation">[]>`
      SELECT daycare_id, id, person_id, kid_id, relationship, code,
             expires_at, sent_at, accepted_at, created_at, updated_at
      FROM invitation
      WHERE daycare_id = ${daycareId}
        AND code = ${code}
      LIMIT 1
    `;

    return rows[0] ? mapInvitationRow(rows[0]) : null;
  }

  /**
   * Persists a pending invitation.
   *
   * @param invitation - Invitation record to insert.
   */
  async create(invitation: Invitation): Promise<void> {
    await this.client`
      INSERT INTO invitation (
        daycare_id,
        id,
        person_id,
        kid_id,
        relationship,
        code,
        expires_at,
        sent_at,
        accepted_at
      )
      VALUES (
        ${invitation.daycareId},
        ${invitation.id},
        ${invitation.personId},
        ${invitation.kidId},
        ${invitation.relationship},
        ${invitation.code},
        ${invitation.expiresAt},
        ${invitation.sentAt},
        ${invitation.acceptedAt}
      )
    `;
  }

  /**
   * Marks an invitation as accepted within its daycare.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @param id - PostgreSQL invitation identifier.
   * @param acceptedAt - ISO instant when the invitation was accepted.
   * @returns The updated invitation or `null` when it does not exist.
   */
  async markAccepted(
    daycareId: string,
    id: string,
    acceptedAt: string,
  ): Promise<Invitation | null> {
    return this.updateTimestamp(daycareId, id, "accepted_at", acceptedAt);
  }

  /**
   * Marks an invitation as sent within its daycare.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @param id - PostgreSQL invitation identifier.
   * @param sentAt - ISO instant when the provider accepted the message.
   * @returns The updated invitation or `null` when it does not exist.
   */
  async markSent(
    daycareId: string,
    id: string,
    sentAt: string,
  ): Promise<Invitation | null> {
    return this.updateTimestamp(daycareId, id, "sent_at", sentAt);
  }

  private async updateTimestamp(
    daycareId: string,
    id: string,
    column: "accepted_at" | "sent_at",
    timestamp: string,
  ): Promise<Invitation | null> {
    const rows = await this.client<Tables<"invitation">[]>`
      UPDATE invitation
      SET ${this.client(column)} = ${timestamp},
          updated_at = now()
      WHERE daycare_id = ${daycareId}
        AND id = ${id}
      RETURNING daycare_id, id, person_id, kid_id, relationship, code,
                expires_at, sent_at, accepted_at, created_at, updated_at
    `;

    return rows[0] ? mapInvitationRow(rows[0]) : null;
  }
}
