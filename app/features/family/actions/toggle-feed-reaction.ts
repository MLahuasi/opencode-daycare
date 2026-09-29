"use server";

import { revalidatePath } from "next/cache";
import { requireActiveSession } from "@/auth";
import { toggleFeedReaction } from "@/app/features/feed/server";
import { getAuthorizedEngagementPosts } from "../services";

/** Serializable result returned by the family feed reaction action. */
export type ToggleFeedReactionResult =
  | { success: true; active: boolean }
  | { success: false; message: string };

/**
 * Authorizes a parent or staff member and toggles their love reaction.
 *
 * @param postId - Stable identifier of the authorized post.
 * @returns The resulting reaction state or a recoverable error.
 */
export async function toggleFeedReactionAction(
  postId: string,
): Promise<ToggleFeedReactionResult> {
  const session = await requireActiveSession();

  const normalizedPostId = postId.trim();
  if (!normalizedPostId) {
    return { success: false, message: "La publicación no es válida." };
  }

  const authorizedPosts = await getAuthorizedEngagementPosts();
  if (!authorizedPosts.some((post) => post.id === normalizedPostId)) {
    return { success: false, message: "No tienes acceso a esta publicación." };
  }

  const reaction = await toggleFeedReaction(
    normalizedPostId,
    session.user.personId,
  );
  revalidatePath("/family-feed");
  revalidatePath("/home");
  revalidatePath("/post-detail");

  return { success: true, active: reaction !== null };
}
