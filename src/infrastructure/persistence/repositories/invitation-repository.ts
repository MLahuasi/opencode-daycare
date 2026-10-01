import "server-only";

import type { InvitationRepository as InvitationRepositoryPort } from "@/src/application/family/ports";
import type { Invitation } from "@/src/domain/family";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

/** JSON-backed persistence adapter for Family invitations. */
export class InvitationRepository implements InvitationRepositoryPort {
  /**
   * Lists all persisted invitations.
   *
   * @returns All invitation records from JSON persistence.
   */
  findAll(): Promise<readonly Invitation[]> {
    return readCollection<Invitation>("invitation.json");
  }

  /**
   * Finds an invitation by its token.
   *
   * @param code - Invitation token to find.
   * @returns The matching invitation or `null` when it does not exist.
   */
  async findByCode(code: string): Promise<Invitation | null> {
    const invitations = await this.findAll();

    return invitations.find((invitation) => invitation.code === code) ?? null;
  }

  /**
   * Persists a new invitation.
   *
   * @param invitation - Invitation record to append.
   * @returns A promise that resolves after persistence completes.
   */
  create(invitation: Invitation): Promise<void> {
    return withWriteLock(async () => {
      const invitations = await this.findAll();

      await writeCollection("invitation.json", [...invitations, invitation]);
    });
  }

  /**
   * Updates one invitation timestamp.
   *
   * @param id - Stable invitation identifier.
   * @param field - Timestamp field to update.
   * @param timestamp - ISO instant to persist.
   * @returns The updated invitation or `null` when it does not exist.
   */
  private updateTimestamp(
    id: string,
    field: "acceptedAt" | "sentAt",
    timestamp: string,
  ): Promise<Invitation | null> {
    return withWriteLock(async () => {
      const invitations = await this.findAll();
      const index = invitations.findIndex((invitation) => invitation.id === id);

      if (index === -1) {
        return null;
      }

      const updatedInvitation = {
        ...invitations[index],
        [field]: timestamp,
      } satisfies Invitation;
      const updatedInvitations = [...invitations];
      updatedInvitations[index] = updatedInvitation;
      await writeCollection("invitation.json", updatedInvitations);

      return updatedInvitation;
    });
  }

  /**
   * Marks an invitation as accepted.
   *
   * @param id - Stable invitation identifier.
   * @param acceptedAt - ISO acceptance instant.
   * @returns The updated invitation or `null` when it does not exist.
   */
  markAccepted(id: string, acceptedAt: string): Promise<Invitation | null> {
    return this.updateTimestamp(id, "acceptedAt", acceptedAt);
  }

  /**
   * Marks an invitation as sent.
   *
   * @param id - Stable invitation identifier.
   * @param sentAt - ISO delivery instant.
   * @returns The updated invitation or `null` when it does not exist.
   */
  markSent(id: string, sentAt: string): Promise<Invitation | null> {
    return this.updateTimestamp(id, "sentAt", sentAt);
  }
}
