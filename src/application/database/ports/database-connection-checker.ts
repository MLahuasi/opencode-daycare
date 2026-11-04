/** Application port for checking the availability of the configured database gateway. */
export interface DatabaseConnectionChecker {
  /** Checks the database gateway and rejects when it is unavailable. */
  check(): Promise<void>;
}
