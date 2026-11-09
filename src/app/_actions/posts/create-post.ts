"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/composition/auth";
import { createPostImageStorage } from "@/composition/post";
import { createPost } from "@/application/post";
import { createPostComposition, getPostViewer } from "@/composition/post";
import { parsePostSubmission } from "./post-action";
import { deleteMediaWithRetry } from "./media-cleanup";
import type { PostFormActionState } from "@/presentation/post/contracts";

/**
 * Validates authorization, uploads media, persists a new post, and returns its destination.
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
  const parsed = await parsePostSubmission(
    formData,
    session.user.personId,
    session.user.daycareId,
  );

  if (!parsed.success) return parsed.state;

  try {
     const createdPost = await createPost(
       createPostComposition(session.user.daycareId),
       {
       authorId: session.user.personId,
       body: parsed.values.body,
       kidIds: parsed.values.kidIds,
       media: parsed.media,
       roomId: parsed.values.roomId,
       type: parsed.values.type,
       },
        await getPostViewer(session.user.daycareId, session.user.personId),
     );

     if (!createdPost) {
       throw new Error("Post creation is not authorized.");
     }
  } catch (error) {
    const persistenceError = error as {
      code?: unknown;
      name?: unknown;
    };
    console.error("[posts] create failed", {
      stage: "persist",
      code: typeof persistenceError.code === "string" ? persistenceError.code : undefined,
      name: typeof persistenceError.name === "string" ? persistenceError.name : "UnknownError",
    });
    const imageStorage = parsed.uploadedMedia.length
      ? createPostImageStorage()
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
  return { errors: {}, message: "", redirectTo: "/home" };
}
