import "server-only";

import { randomInt } from "node:crypto";

const INVITATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITATION_CODE_LENGTH = 8;
const INVITATION_EXPIRATION_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function createRandomInvitationCode(): string {
  return Array.from({ length: INVITATION_CODE_LENGTH }, () =>
    INVITATION_CODE_ALPHABET.charAt(
      randomInt(0, INVITATION_CODE_ALPHABET.length),
    ),
  ).join("");
}

/**
 * Creates a unique cryptographically random invitation code.
 *
 * @param existingCodes - Codes that must not be returned, regardless of their
 *   current invitation state.
 * @returns A unique eight-character invitation code.
 */
export function createInvitationCode(
  existingCodes: readonly string[],
): string {
  const normalizedExistingCodes = new Set(
    existingCodes.map((code) => code.trim().toUpperCase()),
  );
  let code = createRandomInvitationCode();

  while (normalizedExistingCodes.has(code)) {
    code = createRandomInvitationCode();
  }

  return code;
}

/**
 * Calculates the fixed invitation expiration instant.
 *
 * @param now - Base instant from which the expiration is calculated.
 * @returns The expiration instant as an ISO string seven days later.
 */
export function getInvitationExpiration(now: Date = new Date()): string {
  return new Date(
    now.getTime() + INVITATION_EXPIRATION_DAYS * MILLISECONDS_PER_DAY,
  ).toISOString();
}
