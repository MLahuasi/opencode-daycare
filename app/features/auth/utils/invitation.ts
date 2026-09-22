import type { Invitation } from "../types/invitation";

/**
 * Checks whether an invitation expiration instant has passed.
 *
 * @param invitation - Invitation whose expiration should be checked.
 * @param now - Current instant used for the comparison.
 * @returns True when the invitation is expired or has an invalid expiration.
 */
export function isInvitationExpired(
  invitation: Pick<Invitation, "expiresAt">,
  now: Date = new Date(),
): boolean {
  const expirationTime = Date.parse(invitation.expiresAt);

  return Number.isNaN(expirationTime) || expirationTime <= now.getTime();
}
