import { readCollection } from "@/app/infrastructure";
import { FeedOverview, FeedPost } from "../types";

/**
 * Reads the canonical FeedPost collection from disk.
 *
 * @returns A freshly parsed, immutable list of kids.
 */
export function getFeeds(): Promise<readonly FeedPost[]> {
  return readCollection<FeedPost>("feed.json");
}

/**
 * Reads the canonical FeedPost collection from disk.
 *
 * @returns A freshly parsed, immutable list of kids.
 */
export function getFeedOverview(): Promise<readonly FeedOverview[]> {
  return readCollection<FeedOverview>("feed-overview.json");
}
