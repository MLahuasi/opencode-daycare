import "server-only";

import type { ISql } from "postgres";
import { getSupabaseEnvironment } from "@/config/server";
import { PostgresClientProvider } from "./postgres-client-provider";

/** Raised when remote PostgreSQL tests were not explicitly enabled. */
export class RemoteDbTestsDisabledError extends Error {
  constructor() {
    super("Remote PostgreSQL tests require RUN_REMOTE_DB_TESTS=true");
    this.name = "RemoteDbTestsDisabledError";
  }
}

class RollbackRemoteDbTest extends Error {}

/**
 * Runs a remote PostgreSQL test operation and always rolls it back.
 *
 * The operation is never executed unless RUN_REMOTE_DB_TESTS is exactly true.
 * Successful operations throw an internal rollback marker after completion so
 * postgres.js issues ROLLBACK instead of COMMIT. Operation failures are
 * rolled back automatically by postgres.js and are rethrown unchanged.
 *
 * @param operation - Test work receiving the transaction-scoped SQL client.
 * @returns The operation result after its transaction has been rolled back.
 * @throws RemoteDbTestsDisabledError when remote tests are not explicitly enabled.
 */
export async function withRemoteDbTestTransaction<T>(
  operation: (client: ISql) => Promise<T>,
): Promise<T> {
  if (!getSupabaseEnvironment().runRemoteDbTests) {
    throw new RemoteDbTestsDisabledError();
  }

  const client = new PostgresClientProvider().createClient();
  let completed = false;
  let result!: T;

  try {
    try {
      await client.begin(async (transaction) => {
        result = await operation(transaction);
        completed = true;
        throw new RollbackRemoteDbTest();
      });
    } catch (error) {
      if (!(error instanceof RollbackRemoteDbTest)) {
        throw error;
      }
    }

    if (!completed) {
      throw new Error("Remote PostgreSQL test transaction did not complete");
    }

    return result;
  } finally {
    await client.end({ timeout: 5 });
  }
}
