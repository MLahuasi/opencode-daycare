import "server-only";

import { getSupabaseEnvironment } from "@/config/server";
import type { PostgresClient } from "./postgres-client";
import { createPostgresClient } from "./postgres-client";
import type { Options } from "postgres";

/** Creates the server-only PostgreSQL client for the configured Supabase pooler. */
export class PostgresClientProvider {
  /**
   * Creates a PostgreSQL client using the configured Supabase connection.
   *
   * @returns A configured PostgreSQL client.
   */
  createClient(): PostgresClient {
    return createPostgresClient(this.getConnectionOptions());
  }

  /** Returns configured connection options without creating a pool. */
  getConnectionOptions(): Options {
    const { dbHost, dbPort, dbUsername, dbPassword } = getSupabaseEnvironment();

    return {
      host: dbHost,
      port: dbPort,
      database: "postgres",
      username: dbUsername,
      password: dbPassword,
    };
  }
}
