import "server-only";

import { createCloudinaryImageStorage, readCollection } from "@/app/infrastructure";
import type { FeedOverview, FeedPost } from "../types";

type FeedReadOptions = {
  resolveMediaUrls?: boolean;
};

function validateFeedPosts(posts: readonly FeedPost[]): void {
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
}

/**
 * Reads the canonical FeedPost collection from disk.
 *
 * @param options - Whether to resolve signed URLs for media.
 * @returns A freshly parsed list of feed posts.
 */
export async function getFeeds(
  { resolveMediaUrls = true }: FeedReadOptions = {},
): Promise<readonly FeedPost[]> {
  const posts = await readCollection<FeedPost>("feed.json");
  validateFeedPosts(posts);

  return resolveMediaUrls ? resolveFeedMediaUrls(posts) : posts;
}

/**
 * Projects signed media URLs for an already authorized set of feed posts.
 *
 * @param posts - Feed posts whose media access has already been authorized.
 * @returns The posts with signed URLs projected onto their media.
 */
export function resolveFeedMediaUrls(
  posts: readonly FeedPost[],
): readonly FeedPost[] {
  if (!posts.some((post) => post.media.length > 0)) {
    return posts;
  }

  const imageStorage = createCloudinaryImageStorage();
  return posts.map((post) => ({
    ...post,
    media: post.media.map((media) => ({
      ...media,
      url: imageStorage.getUrl(media),
    })),
  }));
}

/**
 * Finds one persisted feed post by stable identifier.
 *
 * @param id - Stable post identifier.
 * @returns The matching post, or null when it does not exist.
 */
export async function getFeedById(id: string): Promise<FeedPost | null> {
  const posts = await getFeeds();
  return posts.find((post) => post.id === id) ?? null;
}

/**
 * Reads the canonical FeedPost collection from disk.
 *
 * @returns A freshly parsed, immutable list of kids.
 */
export function getFeedOverview(): Promise<readonly FeedOverview[]> {
  return readCollection<FeedOverview>("feed-overview.json");
}
