import "server-only";

import type { PostgresQueryClient } from "./client/postgres-client";

type CurrentDaycareRow = {
  id: string;
};

/** Raised when no operational daycare exists in the database. */
export class CurrentDaycareNotFoundError extends Error {
  constructor() {
    super("No operational daycare is configured");
    this.name = "CurrentDaycareNotFoundError";
  }
}

/** Raised when more than one operational daycare exists in the database. */
export class MultipleCurrentDaycaresError extends Error {
  constructor() {
    super("Multiple operational daycares are configured");
    this.name = "MultipleCurrentDaycaresError";
  }
}

/** Reads the single operational daycare used by the migration foundation. */
export class CurrentDaycareProvider {
  public constructor(private readonly client: PostgresQueryClient) {}

  /**
   * Reads the only operational daycare identifier.
   *
   * @returns The unique operational daycare identifier.
   * @throws CurrentDaycareNotFoundError when the table is empty.
   * @throws MultipleCurrentDaycaresError when the table has multiple rows.
   */
  async getCurrentDaycareId(): Promise<string> {
    const rows = await this.client<CurrentDaycareRow[]>`SELECT id FROM daycares`;

    if (rows.length === 0) {
      throw new CurrentDaycareNotFoundError();
    }

    if (rows.length > 1) {
      throw new MultipleCurrentDaycaresError();
    }

    return rows[0].id;
  }
}
