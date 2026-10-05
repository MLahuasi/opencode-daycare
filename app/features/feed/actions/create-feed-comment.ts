"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { createComment } from "@/src/application/post";
import { createPostComposition } from "@/src/composition/post";
import { validateFeedCommentForm } from "../schemas";
import type { FeedCommentActionState } from "./comment-types";

/**
 * Authorizes a parent or staff member, validates a comment and persists it.
 *
 * @param _previousState - Previous feedback required by the action contract.
 * @param formData - Submitted post ID and comment body.
 * @returns Validation or persistence feedback when creation cannot complete.
 */
export async function createFeedCommentAction(
  _previousState: FeedCommentActionState,
  formData: FormData,
): Promise<FeedCommentActionState> {
  const session = await requireActiveSession();

  const postId = formData.get("postId");
  if (typeof postId !== "string" || !postId.trim()) {
    return { errors: {}, message: "La publicación no es válida." };
  }

  const validation = validateFeedCommentForm({ body: formData.get("body") });
  if (!validation.success) {
    return { errors: validation.errors, message: "Revisa el comentario." };
  }

   try {
     const comment = await createComment(
       createPostComposition(),
       {
       authorId: session.user.personId,
       body: validation.data.body,
       postId,
       },
       { personId: session.user.personId, role: session.user.role },
     );

     if (!comment) {
       return { errors: {}, message: "No tienes acceso a esta publicación." };
     }
  } catch {
    return {
      errors: {},
      message: "No pudimos guardar el comentario. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/family-feed");
  revalidatePath("/home");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${encodeURIComponent(postId)}`);
}
