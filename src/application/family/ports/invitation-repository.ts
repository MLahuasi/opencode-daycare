import type { Invitation } from "@/src/domain/family";

/** Persistence operations required by Family invitation use cases. */
export interface InvitationRepository {
  /**
   * Lists invitations to support token uniqueness checks.
   *
   * @returns All persisted invitations.
   */
  findAll(): Promise<readonly Invitation[]>;

  /**
   * Finds an invitation by the token received in its email.
   *
   * @param code - Invitation token to find.
   * @returns The matching invitation or `null` when it does not exist.
   */
  findByCode(code: string): Promise<Invitation | null>;

  /**
   * Persists a newly created pending invitation.
   *
   * @param invitation - Pending invitation to persist.
   * @returns A promise that resolves after persistence completes.
   */
  create(invitation: Invitation): Promise<void>;

  /**
   * Marks an invitation as accepted.
   *
   * @param id - Stable invitation identifier.
   * @param acceptedAt - ISO instant when the invitation was accepted.
   * @returns The updated invitation or `null` when it no longer exists.
   */
  markAccepted(id: string, acceptedAt: string): Promise<Invitation | null>;

  /**
   * Marks an invitation as delivered by the mail provider.
   *
   * @param id - Stable invitation identifier.
   * @param sentAt - ISO instant when the provider accepted the message.
   * @returns The updated invitation or `null` when it no longer exists.
   */
  markSent(id: string, sentAt: string): Promise<Invitation | null>;
}
