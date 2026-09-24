"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/auth";
import { readCollection } from "@/app/infrastructure/persistence";
import { updateFeedPost } from "../services";
import type { FeedPost } from "../types";
import { parsePostSubmission } from "./post-action";
import type { PostFormActionState } from "./types";

/**
 * Revalidates authorization, updates a post, and redirects to the feed.
 *
 * @param _previousState - Previous feedback required by the action contract.
 * @param formData - Submitted post form payload.
 * @returns Validation or persistence feedback when editing cannot complete.
 */
export async function updatePostAction(
  _previousState: PostFormActionState,
  formData: FormData,
): Promise<PostFormActionState> {
  const session = await requireStaffSession();
  const postId = formData.get("postId");

  if (typeof postId !== "string" || !postId.trim()) {
    return { errors: { postId: "Indica la publicación que deseas editar." }, message: "Revisa los campos marcados." };
  }

  const posts = await readCollection<FeedPost>("feed.json");
  const currentPost = posts.find((post) => post.id === postId);

  if (!currentPost || currentPost.authorId !== session.user.personId) {
    return { errors: {}, message: "No tienes permiso para editar esta publicación." };
  }

  const parsed = await parsePostSubmission(formData, session.user.personId, currentPost.media);
  if (!parsed.success) return parsed.state;

  try {
    const updatedPost = await updateFeedPost(postId, {
      authorId: session.user.personId,
      body: parsed.values.body,
      kidId: parsed.values.kidId,
      media: parsed.media,
      roomId: parsed.values.roomId,
      subject: parsed.subject,
      type: parsed.values.type,
    });

    if (!updatedPost) {
      return { errors: {}, message: "La publicación ya no existe." };
    }
  } catch {
    return { errors: {}, message: "No pudimos guardar la publicación. Inténtalo nuevamente." };
  }

  revalidatePath("/home");
  redirect("/home");
}
