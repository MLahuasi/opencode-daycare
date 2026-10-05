"use server";

import { revalidatePath } from "next/cache";
import { requireActiveSession } from "@/auth";
import { toggleReaction } from "@/application/post";
import { createPostComposition } from "@/composition/post";

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

   try {
     const result = await toggleReaction(
       createPostComposition(),
       normalizedPostId,
       { personId: session.user.personId, role: session.user.role },
     );

     if (!result) {
       return { success: false, message: "No tienes acceso a esta publicación." };
     }

     revalidatePath("/family-feed");
     revalidatePath("/home");
     revalidatePath(`/posts/${normalizedPostId}`);
     return { success: true, active: result.active };
   } catch {
    return {
      success: false,
      message: "No pudimos actualizar tu reacción. Inténtalo nuevamente.",
    };
  }
}
