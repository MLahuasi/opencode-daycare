"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import {
  createFeedComment,
  validateFeedCommentForm,
} from "@/app/features/feed/server";
import { getFamilyFeed } from "../services";
import type { FeedCommentActionState } from "./types";

/**
 * Authorizes a parent, validates a comment and persists it for an authorized post.
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

  if (session.user.role !== "parent") {
    return { errors: {}, message: "Solo las familias pueden comentar." };
  }

  const postId = formData.get("postId");
  if (typeof postId !== "string" || !postId.trim()) {
    return { errors: {}, message: "La publicación no es válida." };
  }

  const validation = validateFeedCommentForm({ body: formData.get("body") });
  if (!validation.success) {
    return { errors: validation.errors, message: "Revisa el comentario." };
  }

  const authorizedPosts = await getFamilyFeed({ kind: "all" });
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
  revalidatePath("/post-detail");
  redirect(`/post-detail?id=${encodeURIComponent(postId)}`);
}
