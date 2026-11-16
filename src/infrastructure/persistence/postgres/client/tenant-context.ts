import "server-only";

import type { PostgresQueryClient } from "./postgres-client";

export type PostgresTenantContext = {
  daycareId: string | (() => Promise<string>);
  personId?: string | (() => Promise<string | undefined>);
};

type UntypedPostgresQuery = {
  (
    strings: TemplateStringsArray,
    ...values: readonly unknown[]
  ): Promise<unknown>;
  (...values: readonly unknown[]): unknown;
};

function isTemplateStringsArray(value: unknown): value is TemplateStringsArray {
  return Array.isArray(value) && "raw" in value;
}

async function resolveContextValue<T>(
  value: T | (() => Promise<T>) | undefined,
): Promise<T | undefined> {
  return typeof value === "function"
    ? await (value as () => Promise<T>)()
    : value;
}

/** Runs work with PostgreSQL settings local to one transaction. */
export async function withPostgresTenantContext<T>(
  client: PostgresQueryClient,
  context: PostgresTenantContext,
  operation: (transaction: PostgresQueryClient) => Promise<T>,
): Promise<T> {
  const daycareId = await resolveContextValue(context.daycareId);
  if (!daycareId) {
    throw new Error("A daycare context is required for PostgreSQL access.");
  }

  const personId = await resolveContextValue(context.personId);

  return client.begin(async (transaction) => {
    // set_config(..., true) is PostgreSQL's transaction-local equivalent of
    // SET LOCAL and cannot leak to a pooled connection after this transaction.
    await transaction`select set_config('app.daycare_id', ${daycareId}, true)`;
    await transaction`
      select set_config('app.person_id', ${personId ?? ""}, true)
    `;
    return operation(transaction);
  });
}

/** Binds repository calls to a transaction-local daycare/person context. */
export function createTenantScopedPostgresClient(
  client: PostgresQueryClient,
  context: PostgresTenantContext,
): PostgresQueryClient {
  const query = ((
    stringsOrValue: TemplateStringsArray | unknown,
    ...values: unknown[]
  ) => {
    // A direct call such as client(ids) creates a composable postgres.js SQL
    // fragment for an IN (...) clause; it does not execute a query and must
    // remain synchronous. Only tagged templates need the tenant transaction.
    if (!isTemplateStringsArray(stringsOrValue)) {
      return (client as unknown as UntypedPostgresQuery)(
        stringsOrValue,
        ...values,
      );
    }

    return withPostgresTenantContext(client, context, (transaction) =>
      (transaction as unknown as UntypedPostgresQuery)(
        stringsOrValue,
        ...values,
      ),
    );
  }) as unknown as Record<string, unknown>;

  query.begin = <T>(
    operation: (transaction: PostgresQueryClient) => Promise<T>,
  ) => withPostgresTenantContext(client, context, operation);

  return query as unknown as PostgresQueryClient;
}
