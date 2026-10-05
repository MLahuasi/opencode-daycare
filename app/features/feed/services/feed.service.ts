import "server-only";

import { createPostImageStorage } from "@/src/composition/post";
import { readCollection } from "@/src/infrastructure/persistence";
import type { FeedOverview, FeedPost, PersistedFeedPost } from "../types";
import { getFeedEngagementByPostIds } from "./engagement.service";

type FeedReadOptions = {
  resolveMediaUrls?: boolean;
  viewerId?: string;
};

/**
 * Validates that every feed Post has exactly one destination.
 *
 * @param posts - Feed Posts to validate.
 * @returns Nothing when all Posts are valid.
 * @throws Error when a Post targets both a kid and a room, or neither.
 */
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
  { resolveMediaUrls = true, viewerId }: FeedReadOptions = {},
): Promise<readonly FeedPost[]> {
  const persistedPosts = await readCollection<PersistedFeedPost>("feed.json");
  const engagement = await getFeedEngagementByPostIds(
    persistedPosts.map((post) => post.id),
    viewerId,
  );
  const posts = persistedPosts.map((post) => ({
    ...post,
    engagement: engagement.get(post.id) ?? {
      reactionCount: 0,
      commentCount: 0,
      viewerHasLoved: false,
    },
  }));
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

  const imageStorage = createPostImageStorage();
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
