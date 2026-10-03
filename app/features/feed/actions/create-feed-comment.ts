"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { createFeedComment } from "../services/comment.service";
import { validateFeedCommentForm } from "../schemas";
import { getAuthorizedEngagementPosts } from "../services/family-feed.service";
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

  const authorizedPosts = await getAuthorizedEngagementPosts();
  if (!authorizedPosts.some((post) => post.id === postId)) {
    return { errors: {}, message: "No tienes acceso a esta publicación." };
  }

  try {
    await createFeedComment({
      authorId: session.user.personId,
      body: validation.data.body,
      postId,
    });
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
