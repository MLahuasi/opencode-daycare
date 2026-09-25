"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/auth";
import { createCloudinaryImageStorage } from "@/app/infrastructure";
import { createFeedPost } from "../services";
import { parsePostSubmission } from "./post-action";
import { deleteMediaWithRetry } from "./media-cleanup";
import type { PostFormActionState } from "./types";

/**
 * Validates authorization, uploads media, persists a new post, and redirects.
 *
 * @param _previousState - Previous feedback required by the action contract.
 * @param formData - Submitted post form payload.
 * @returns Validation or persistence feedback when creation cannot complete.
 */
export async function createPostAction(
  _previousState: PostFormActionState,
  formData: FormData,
): Promise<PostFormActionState> {
  const session = await requireStaffSession();
  const parsed = await parsePostSubmission(formData, session.user.personId);

  if (!parsed.success) return parsed.state;

  try {
    await createFeedPost({
      authorId: session.user.personId,
      body: parsed.values.body,
      kidId: parsed.values.kidId,
      media: parsed.media,
      roomId: parsed.values.roomId,
      subject: parsed.subject,
      type: parsed.values.type,
    });
  } catch {
    const imageStorage = parsed.uploadedMedia.length
      ? createCloudinaryImageStorage()
      : null;
    let cleanupSucceeded = true;

    if (imageStorage) {
      try {
        await Promise.all(
          parsed.uploadedMedia.map((media) =>
            deleteMediaWithRetry(imageStorage, media.publicId),
          ),
        );
      } catch {
        cleanupSucceeded = false;
      }
    }
    return {
      errors: {},
      message: cleanupSucceeded
        ? "No pudimos guardar la publicación. Inténtalo nuevamente."
        : "No pudimos guardar la publicación ni limpiar todos los assets. Requiere reintento.",
    };
  }

  revalidatePath("/home");
  redirect("/home");
}
