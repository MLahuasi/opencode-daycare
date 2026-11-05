import "server-only";

import { getSupabaseEnvironment } from "@/config/server";
import type { PostgresClient } from "./postgres-client";
import { createPostgresClient } from "./postgres-client";

const POSTGRES_DATABASE = "postgres";
const POSTGRES_PORT = 5432;
const POSTGRES_USERNAME = "postgres";

/**
 * Derives the Supabase direct PostgreSQL hostname from the project URL.
 *
 * @param supabaseUrl - Validated Supabase project URL.
 * @returns The direct PostgreSQL hostname for the Supabase project.
 */
export function derivePostgresHost(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname;

  return `db.${hostname}`;
}

/** Creates the server-only direct PostgreSQL client for Supabase. */
export class PostgresClientProvider {
  /**
   * Creates a PostgreSQL client using the direct Supabase connection.
   *
   * @returns A configured PostgreSQL client.
   */
  createClient(): PostgresClient {
    const { url, dbPassword } = getSupabaseEnvironment();

    return createPostgresClient({
      host: derivePostgresHost(url),
      port: POSTGRES_PORT,
      database: POSTGRES_DATABASE,
      username: POSTGRES_USERNAME,
      password: dbPassword,
    });
  }
}
