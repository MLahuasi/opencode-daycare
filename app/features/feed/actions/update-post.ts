"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/auth";
import { createCloudinaryImageStorage } from "@/app/infrastructure";
import { readCollection } from "@/app/infrastructure/persistence";
import { updateFeedPost } from "../services";
import type { FeedMedia, FeedPost } from "../types";
import { parsePostSubmission } from "./post-action";
import { deleteMediaWithRetry } from "./media-cleanup";
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
    const imageStorage = parsed.uploadedMedia.length
      ? createCloudinaryImageStorage()
      : null;
    await Promise.allSettled(
      parsed.uploadedMedia.map((media) => imageStorage?.delete(media.publicId)),
    );
    return { errors: {}, message: "No pudimos guardar la publicación. Inténtalo nuevamente." };
  }

  const removedMedia = currentPost.media.filter(
    (media) => !parsed.media.some((retained) => retained.id === media.id),
  );
  if (removedMedia.length > 0) {
    const imageStorage = createCloudinaryImageStorage();
    const failedMedia: FeedMedia[] = [];

    for (const media of removedMedia) {
      let deleted = false;

      for (let attempt = 0; attempt < 3 && !deleted; attempt += 1) {
        try {
          await imageStorage.delete(media.publicId);
          deleted = true;
        } catch {
          // Retry transient provider failures before preserving the reference.
        }
      }

      if (!deleted) failedMedia.push(media);
    }

    if (failedMedia.length > 0) {
      const uploadedIds = new Set(
        parsed.uploadedMedia.map((media) => media.id),
      );
      try {
        await Promise.all(
          parsed.uploadedMedia.map((media) =>
            deleteMediaWithRetry(imageStorage, media.publicId),
          ),
        );
      } catch {
        // The restored post keeps failed deletions addressable for a later retry.
      }
      await updateFeedPost(postId, {
        authorId: session.user.personId,
        body: parsed.values.body,
        kidId: parsed.values.kidId,
        media: [
          ...parsed.media.filter((media) => !uploadedIds.has(media.id)),
          ...failedMedia,
        ],
        roomId: parsed.values.roomId,
        subject: parsed.subject,
        type: parsed.values.type,
      });
      return {
        errors: { media: "No pudimos retirar todas las imágenes. Inténtalo nuevamente." },
        message: "La publicación se guardó, pero algunas imágenes no se pudieron retirar.",
      };
    }
  }

  revalidatePath("/home");
  redirect("/home");
}
