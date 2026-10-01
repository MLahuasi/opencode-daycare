/** Generates stable identifiers for new Auth records. */
export interface AuthIdentifierGenerator {
  /**
   * Creates a new unique identifier.
   *
   * @returns A new stable identifier.
   */
  create(): string;
}
