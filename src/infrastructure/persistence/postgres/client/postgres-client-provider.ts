import "server-only";

import { getSupabaseEnvironment } from "@/config/server";
import type { PostgresClient } from "./postgres-client";
import { createPostgresClient } from "./postgres-client";

/** Creates the server-only PostgreSQL client for the configured Supabase pooler. */
export class PostgresClientProvider {
  /**
   * Creates a PostgreSQL client using the configured Supabase connection.
   *
   * @returns A configured PostgreSQL client.
   */
  createClient(): PostgresClient {
    const { dbHost, dbPort, dbUsername, dbPassword, dbSslMode } =
      getSupabaseEnvironment();

    return createPostgresClient({
      host: dbHost,
      port: dbPort,
      database: "postgres",
      username: dbUsername,
      password: dbPassword,
      ssl: dbSslMode,
    });
  }
}
