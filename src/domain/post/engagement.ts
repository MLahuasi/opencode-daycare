import type { PostComment } from "./comment";
import type { PostEngagement } from "./post";
import type { PostReaction } from "./reaction";

/**
 * Derives engagement values from related Post collections.
 *
 * @param postId - Stable identifier of the Post.
 * @param comments - Comments available for projection.
 * @param reactions - Reactions available for projection.
 * @param viewerId - Optional person used to calculate their love state.
 * @returns Derived engagement values for the Post.
 */
export function derivePostEngagement(
  postId: string,
  comments: readonly PostComment[],
  reactions: readonly PostReaction[],
  viewerId?: string,
): PostEngagement {
  const postComments = comments.filter((comment) => comment.postId === postId);
  const postReactions = reactions.filter((reaction) => reaction.postId === postId);

  return {
    commentCount: postComments.length,
    reactionCount: postReactions.length,
    viewerHasLoved: viewerId
      ? postReactions.some(
          (reaction) =>
            reaction.personId === viewerId && reaction.type === "love",
        )
      : false,
  };
}
