/**
 * Transaction boundary required by the Auth acceptance workflow.
 *
 * Infrastructure implementations must execute the complete callback on the
 * same database transaction. The application layer intentionally receives no
 * PostgreSQL client or provider-specific transaction type.
 */
export interface AuthTransactionRunner {
  /**
   * Runs an Auth operation atomically.
   *
   * @param operation - Auth operation whose writes must share one transaction.
   * @returns The operation result after the transaction completes.
   */
  run<T>(operation: () => Promise<T>): Promise<T>;
}
