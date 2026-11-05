import "server-only";

import postgres, { type Options, type Sql, type TransactionSql } from "postgres";

/** The server-only PostgreSQL client type used by persistence adapters. */
export type PostgresClient = Sql;

/** Query client shared by the root connection and a transaction. */
export type PostgresQueryClient = Sql | TransactionSql;

/**
 * Creates a PostgreSQL client with the connection safety defaults shared by
 * server-side persistence adapters.
 *
 * Connection details are supplied by the infrastructure provider so this
 * module does not read or expose runtime secrets.
 *
 * @param options - Connection details and optional postgres.js overrides.
 * @returns A configured server-only PostgreSQL client.
 */
export function createPostgresClient(options: Options = {}): PostgresClient {
  return postgres({
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ...options,
  });
}
