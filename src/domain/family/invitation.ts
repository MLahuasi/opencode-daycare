import type { ParentRelationship } from "./parent-relationship";

/** Invitation sent to a person to establish a parent-kid relationship. */
export type Invitation = {
  id: string;
  personId: string;
  kidId: string;
  relationship: ParentRelationship;
  code: string;
  expiresAt: string;
  sentAt: string | null;
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
