import "server-only";

import { readCollection } from "@/src/infrastructure/persistence";

/** Visual copy persisted for the staff feed header. */
export type FeedOverviewRecord = {
  roomLabel: string;
  greeting: string;
  attendance: string;
  date: string;
  composerPrompt: string;
  publishedTodayLabel: string;
};

/**
 * Reads the configured staff feed header through the JSON adapter.
 *
 * @returns Persisted feed overview records.
 */
export function getFeedOverview(): Promise<readonly FeedOverviewRecord[]> {
  return readCollection<FeedOverviewRecord>("feed-overview.json");
}
