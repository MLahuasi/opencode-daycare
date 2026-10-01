/** Capability used to keep related Family and Auth writes atomic. */
export interface TransactionRunner {
  /**
   * Runs an operation and rolls it back when the operation fails.
   *
   * @param operation - Async operation whose writes must be atomic.
   * @returns The operation result after the transaction completes.
   */
  run<T>(operation: () => Promise<T>): Promise<T>;
}
