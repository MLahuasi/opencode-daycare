"use server";

import { revalidatePath } from "next/cache";
import { requireActiveSession } from "@/auth";
import { toggleFeedReaction } from "../services/reaction.service";
import { getAuthorizedEngagementPosts } from "../services/engagement-authorization.service";

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

  let reaction;

  try {
    reaction = await toggleFeedReaction(
      normalizedPostId,
      session.user.personId,
    );
  } catch {
    return {
      success: false,
      message: "No pudimos actualizar tu reacción. Inténtalo nuevamente.",
    };
  }
  revalidatePath("/family-feed");
  revalidatePath("/home");
  revalidatePath(`/posts/${normalizedPostId}`);

  return { success: true, active: reaction !== null };
}
