import "server-only";

import { checkDatabaseConnection } from "@/application/database";
import { databaseClient } from "@/infrastructure/adapters/database";

/** Server-side composition for the database connection check. */
export function createDatabaseComposition() {
  return {
    /** Runs the database connection use case with the configured adapter. */
    checkConnection: () => checkDatabaseConnection(databaseClient),
  };
}
