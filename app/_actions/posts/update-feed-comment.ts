"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { updateComment } from "@/src/application/post";
import { createPostComposition } from "@/src/composition/post";
import { validateFeedCommentForm } from "@/src/presentation/post/schemas";
import type { FeedCommentActionState } from "./comment-types";

/**
 * Authorizes ownership, validates and updates a person's own comment.
 *
 * @param _previousState - Previous feedback required by the action contract.
 * @param formData - Submitted comment ID, post ID and body.
 * @returns Validation or persistence feedback when the update cannot complete.
 */
export async function updateFeedCommentAction(
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

  const validation = validateFeedCommentForm({ body: formData.get("body") });
  if (!validation.success) {
    return { errors: validation.errors, message: "Revisa el comentario." };
  }

  try {
     const updatedComment = await updateComment(
       createPostComposition(),
       {
       authorId: session.user.personId,
       body: validation.data.body,
       commentId,
       },
       { personId: session.user.personId, role: session.user.role },
     );

    if (!updatedComment) {
      return { errors: {}, message: "El comentario ya no está disponible." };
    }
  } catch {
    return {
      errors: {},
      message: "No pudimos actualizar el comentario. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/family-feed");
  revalidatePath("/home");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${encodeURIComponent(postId)}`);
}
