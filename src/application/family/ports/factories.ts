/** Generates stable identifiers for new persisted records. */
export interface IdentifierGenerator {
  /**
   * Creates a new unique identifier.
   *
   * @returns A new stable identifier.
   */
  create(): string;
}

/** Generates unique invitation tokens. */
export interface InvitationCodeGenerator {
  /**
   * Creates a token not present in the supplied collection.
   *
   * @param existingCodes - Tokens that must not be reused.
   * @returns A unique invitation token.
   */
  create(existingCodes: readonly string[]): string;
}

/** Calculates invitation expiration instants. */
export interface InvitationExpirationPolicy {
  /**
   * Returns the expiration instant for an invitation.
   *
   * @param now - Instant from which expiration is calculated.
   * @returns The expiration instant as an ISO string.
   */
  getExpiration(now: Date): string;
}

/** Supplies the current instant to application use cases. */
export interface Clock {
  /**
   * Returns the current instant.
   *
   * @returns The current date and time.
   */
  now(): Date;
}
