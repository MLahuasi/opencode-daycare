import "server-only";

import type { PostgresClient } from "./postgres-client";
import { createPostgresClient } from "./postgres-client";
import { PostgresClientProvider } from "./postgres-client-provider";

const SHARED_CLIENT_KEY = "__openDaycareSharedPostgresClient";

type GlobalWithSharedClient = typeof globalThis & {
  [SHARED_CLIENT_KEY]?: PostgresClient;
};

/**
 * Returns the single PostgreSQL pool used by the application runtime.
 *
 * The global reference prevents Next.js development reloads from creating
 * another pool for the same Node.js process.
 */
export function getSharedPostgresClient(): PostgresClient {
  const globalState = globalThis as GlobalWithSharedClient;
  globalState[SHARED_CLIENT_KEY] ??= createPostgresClient({
    ...getPostgresConnectionOptions(),
    max: 5,
  });
  return globalState[SHARED_CLIENT_KEY];
}

function getPostgresConnectionOptions() {
  const provider = new PostgresClientProvider();
  return provider.getConnectionOptions();
}
