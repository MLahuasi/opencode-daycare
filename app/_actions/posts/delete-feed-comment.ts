"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { deleteComment } from "@/src/application/post";
import { createPostComposition } from "@/src/composition/post";
import type { FeedCommentActionState } from "./comment-types";

/**
 * Authorizes ownership and physically deletes a person's own comment.
 *
 * @param _previousState - Previous feedback required by the action contract.
 * @param formData - Submitted comment and post identifiers.
 * @returns Feedback when deletion cannot complete.
 */
export async function deleteFeedCommentAction(
  _previousState: FeedCommentActionState,
  formData: FormData,
): Promise<FeedCommentActionState> {
  const session = await requireActiveSession();

  const commentId = formData.get("commentId");
  const postId = formData.get("postId");
  if (
    typeof commentId !== "string" ||
    !commentId.trim() ||
    typeof postId !== "string" ||
    !postId.trim()
  ) {
    return { errors: {}, message: "El comentario no es válido." };
  }

   try {
     const deleted = await deleteComment(
       createPostComposition(),
       commentId,
       { personId: session.user.personId, role: session.user.role },
     );

    if (!deleted) {
      return { errors: {}, message: "El comentario ya no está disponible." };
    }
  } catch {
    return {
      errors: {},
      message: "No pudimos eliminar el comentario. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/family-feed");
  revalidatePath("/home");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${encodeURIComponent(postId)}`);
}
