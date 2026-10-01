/** Stable identifier generator required by Post commands. */
export interface PostIdentifierGenerator {
  /**
   * Creates a new stable identifier.
   *
   * @returns A new stable identifier.
   */
  create(): string;
}

/** Current-time provider required by Post commands. */
export interface PostClock {
  /**
   * Returns the current instant.
   *
   * @returns The current date and time.
   */
  now(): Date;
}
