import "server-only";

import type { PostgresClient } from "@/infrastructure/persistence/postgres/client/postgres-client";
import { PostgresClientProvider } from "@/infrastructure/persistence/postgres/client/postgres-client-provider";

let databaseClientInstance: PostgresClient | undefined;
let initializationPromise: Promise<void> | undefined;

async function initializeDatabaseClient(): Promise<void> {
  if (!databaseClientInstance) {
    const provider = new PostgresClientProvider();
    databaseClientInstance = provider.createClient();
  }
}

/** Server-only facade for the configured database client lifecycle. */
export const databaseClient = {
  /** Creates and stores the database client once for this server instance. */
  initialize(): Promise<void> {
    initializationPromise ??= initializeDatabaseClient();
    return initializationPromise;
  },
  /** Checks the configured PostgreSQL connection once initialized. */
  async checkConnection(): Promise<void> {
    await this.initialize();
    await databaseClientInstance!`SELECT 1`;
  },
  /** Implements the application database connection-checking port. */
  check(): Promise<void> {
    return this.checkConnection();
  },
};
