import "server-only";

import {
  CurrentDaycareProvider,
  PostgresClientProvider,
  type PostgresClient,
} from "@/infrastructure/persistence/postgres";

let client: PostgresClient | undefined;
let currentDaycare: CurrentDaycareProvider | undefined;

/** Returns the shared server-side PostgreSQL client used by runtime compositions. */
export function getPostgresRuntimeClient(): PostgresClient {
  client ??= new PostgresClientProvider().createClient();
  return client;
}

/** Returns the runtime provider for the configured operational daycare. */
export function getPostgresRuntimeDaycare(): CurrentDaycareProvider {
  currentDaycare ??= new CurrentDaycareProvider(getPostgresRuntimeClient());
  return currentDaycare;
}
