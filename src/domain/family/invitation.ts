import type { ParentRelationship } from "./parent-relationship";

/** Invitation sent to a person to establish a parent-kid relationship. */
export type Invitation = {
  /** Stable invitation identifier. */
  id: string;
  /** Stable invited person identifier. */
  personId: string;
  /** Stable kid identifier receiving the invitation. */
  kidId: string;
  /** Relationship requested by the invited person. */
  relationship: ParentRelationship;
  /** Token included in the invitation URL. */
  code: string;
  /** ISO instant after which the token is invalid. */
  expiresAt: string;
  /** ISO instant when the email provider accepted the message. */
  sentAt: string | null;
  /** ISO instant when the invitation was accepted. */
  acceptedAt: string | null;
};

/**
 * Checks whether an invitation is expired at a given instant.
 *
 * @param invitation - Invitation expiration to evaluate.
 * @param invitation.expiresAt - ISO expiration instant.
 * @param now - Instant used as the comparison reference.
 * @returns Whether the invitation is expired or has an invalid expiration.
 */
export function isInvitationExpired(
  invitation: Pick<Invitation, "expiresAt">,
  now: Date = new Date(),
): boolean {
  const expirationTime = Date.parse(invitation.expiresAt);

  return Number.isNaN(expirationTime) || expirationTime <= now.getTime();
}

/**
 * Returns the persisted lifecycle state of an invitation.
 *
 * @param invitation - Invitation lifecycle values to evaluate.
 * @param invitation.acceptedAt - ISO acceptance instant, when accepted.
 * @param invitation.expiresAt - ISO expiration instant.
 * @param now - Instant used as the comparison reference.
 * @returns The pending, expired or accepted invitation state.
 */
export function getInvitationStatus(
  invitation: Pick<Invitation, "acceptedAt" | "expiresAt">,
  now: Date = new Date(),
): "pending" | "expired" | "accepted" {
  if (invitation.acceptedAt) {
    return "accepted";
  }

  return isInvitationExpired(invitation, now) ? "expired" : "pending";
}
