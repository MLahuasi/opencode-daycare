import "server-only";

import { readCollection } from "@/src/infrastructure/persistence";
import type { FeedComment, FeedEngagement, FeedReaction } from "../types";

const EMPTY_ENGAGEMENT: FeedEngagement = {
  reactionCount: 0,
  commentCount: 0,
  viewerHasLoved: false,
};

/**
 * Reads derived engagement values for a set of feed posts.
 *
 * @param postIds - Stable identifiers of the posts to project.
 * @param viewerId - Optional authenticated person used to calculate their like state.
 * @returns Engagement values indexed by post identifier.
 */
export async function getFeedEngagementByPostIds(
  postIds: readonly string[],
  viewerId?: string,
): Promise<ReadonlyMap<string, FeedEngagement>> {
  if (postIds.length === 0) return new Map();

  const [comments, reactions] = await Promise.all([
    readCollection<FeedComment>("feed-comments.json"),
    readCollection<FeedReaction>("feed-reactions.json"),
  ]);
  const engagement = new Map(
    postIds.map((postId) => [postId, { ...EMPTY_ENGAGEMENT }]),
  );

  for (const comment of comments) {
    const values = engagement.get(comment.postId);
    if (values) values.commentCount += 1;
  }

  for (const reaction of reactions) {
    const values = engagement.get(reaction.postId);
    if (!values) continue;

    values.reactionCount += 1;
    if (viewerId && reaction.personId === viewerId && reaction.type === "love") {
      values.viewerHasLoved = true;
    }
  }

  return engagement;
}

/**
 * Reads derived engagement values for one feed post.
 *
 * @param postId - Stable identifier of the post to project.
 * @param viewerId - Optional authenticated person used to calculate their like state.
 * @returns Engagement values for the requested post.
 */
export async function getFeedEngagement(
  postId: string,
  viewerId?: string,
): Promise<FeedEngagement> {
  const engagement = await getFeedEngagementByPostIds([postId], viewerId);
  return engagement.get(postId) ?? { ...EMPTY_ENGAGEMENT };
}
