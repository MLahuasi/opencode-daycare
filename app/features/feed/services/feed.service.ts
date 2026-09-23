import { readCollection } from "@/app/infrastructure";
import { FeedOverview, FeedPost } from "../types";

/**
 * Reads the canonical FeedPost collection from disk.
 *
 * @returns A freshly parsed, immutable list of kids.
 */
export function getFeeds(): Promise<readonly FeedPost[]> {
  return readCollection<FeedPost>("feed.json").then((posts) => {
    for (const post of posts) {
      const hasKidDestination = post.kidId !== null && post.kidId !== undefined;
      const hasRoomDestination =
        post.roomId !== null && post.roomId !== undefined;

      if (hasKidDestination === hasRoomDestination) {
        throw new Error(
          `Feed post ${post.id} must have exactly one destination: kidId or roomId.`,
        );
      }
    }

    return posts;
  });
}

/**
 * Reads the canonical FeedPost collection from disk.
 *
 * @returns A freshly parsed, immutable list of kids.
 */
export function getFeedOverview(): Promise<readonly FeedOverview[]> {
  return readCollection<FeedOverview>("feed-overview.json");
}
