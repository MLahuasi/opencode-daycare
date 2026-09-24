"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/auth";
import { createFeedPost } from "../services";
import { parsePostSubmission } from "./post-action";
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
    return { errors: {}, message: "No pudimos guardar la publicación. Inténtalo nuevamente." };
  }

  revalidatePath("/home");
  redirect("/home");
}
