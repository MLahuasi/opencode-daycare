"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import {
  deleteFeedComment,
  getFeedCommentById,
} from "@/app/features/feed/server";
import { getAuthorizedEngagementPosts } from "../services";
import type { FeedCommentActionState } from "./types";

/**
 * Authorizes ownership and physically deletes a parent's own comment.
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

  const comment = await getFeedCommentById(commentId);
  if (
    !comment ||
    comment.authorId !== session.user.personId ||
    comment.postId !== postId
  ) {
    return { errors: {}, message: "No tienes permiso para eliminar este comentario." };
  }

  const authorizedPosts = await getAuthorizedEngagementPosts();
  if (!authorizedPosts.some((post) => post.id === postId)) {
    return { errors: {}, message: "No tienes acceso a esta publicación." };
  }

  try {
    const deleted = await deleteFeedComment({
      authorId: session.user.personId,
      commentId,
    });

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
  revalidatePath("/post-detail");
  redirect(`/post-detail?id=${encodeURIComponent(postId)}`);
}
