"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/auth";
import { createPostImageStorage } from "@/composition/post";
import { updatePost } from "@/application/post";
import { createPostComposition } from "@/composition/post";
import type { PostMedia } from "@/domain/post";
import { parsePostSubmission } from "./post-action";
import { deleteMediaWithRetry } from "./media-cleanup";
import type { PostFormActionState } from "@/presentation/post/contracts";

/**
 * Revalidates authorization, updates a post, and returns the feed destination.
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

  const dependencies = createPostComposition();
  const currentPost = await dependencies.posts.findById(postId);

  if (!currentPost || currentPost.authorId !== session.user.personId) {
    return { errors: {}, message: "No tienes permiso para editar esta publicación." };
  }

  const parsed = await parsePostSubmission(formData, session.user.personId, currentPost.media);
  if (!parsed.success) return parsed.state;

  try {
    const updatedPost = await updatePost(
      dependencies,
      postId,
      {
        authorId: session.user.personId,
       body: parsed.values.body,
        kidIds: parsed.values.kidId ? [parsed.values.kidId] : [],
       media: parsed.media,
       roomId: parsed.values.roomId,
       subject: parsed.subject,
        type: parsed.values.type,
      },
      { personId: session.user.personId, role: session.user.role },
    );

    if (!updatedPost) {
      return { errors: {}, message: "La publicación ya no existe." };
    }
  } catch {
    const imageStorage = parsed.uploadedMedia.length
      ? createPostImageStorage()
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
    const imageStorage = createPostImageStorage();
    const failedMedia: PostMedia[] = [];

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
      await updatePost(
        dependencies,
        postId,
        {
          authorId: session.user.personId,
          body: parsed.values.body,
          kidIds: parsed.values.kidId ? [parsed.values.kidId] : [],
          media: [
            ...parsed.media.filter((media) => !uploadedIds.has(media.id)),
            ...failedMedia,
          ],
          roomId: parsed.values.roomId,
          subject: parsed.subject,
          type: parsed.values.type,
        },
        { personId: session.user.personId, role: session.user.role },
      );
      return {
        errors: { media: "No pudimos retirar todas las imágenes. Inténtalo nuevamente." },
        message: "La publicación se guardó, pero algunas imágenes no se pudieron retirar.",
      };
    }
  }

  revalidatePath("/home");
  revalidatePath(`/posts/${postId}`);
  return { errors: {}, message: "", redirectTo: "/home" };
}
