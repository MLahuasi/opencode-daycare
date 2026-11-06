import "server-only";

import { PostgresFeedOverviewRepository } from "@/infrastructure/persistence/postgres";
import { getPostgresRuntimeClient } from "../postgres-runtime";
import type { FeedOverviewRecord } from "@/infrastructure/persistence/postgres";

/** Visual copy persisted for the staff feed header. */
export type { FeedOverviewRecord } from "@/infrastructure/persistence/postgres";

/**
 * Reads the configured staff feed header through the JSON adapter.
 *
 * @returns Persisted feed overview records.
 */
export function getFeedOverview(daycareId: string): Promise<readonly FeedOverviewRecord[]> {
  return new PostgresFeedOverviewRepository(getPostgresRuntimeClient()).findAll(daycareId);
}
