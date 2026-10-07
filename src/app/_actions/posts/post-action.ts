import { randomUUID } from "node:crypto";
import { createPostImageStorage } from "@/composition/post";
import { getPostTargets, hasPhotoSharingConsent } from "@/application/post";
import { createPostComposition } from "@/composition/post";
import {
  MAX_MEDIA_BYTES,
  validatePostForm,
  type PostFormValues,
} from "@/presentation/post/schemas";
import type { PostFormActionState } from "@/presentation/post/contracts";
import { deleteMediaWithRetry } from "./media-cleanup";
import type { PostMedia } from "@/domain/post";
import { isSupportedImageFile } from "@/presentation/post/utils";
import {
  createRestrictionConfirmationToken,
  verifyRestrictionConfirmationToken,
} from "./restriction-confirmation";

type ParsedPostSubmission =
  | {
      success: true;
      values: PostFormValues;
      media: PostMedia[];
      uploadedMedia: PostMedia[];
    }
  | { success: false; state: PostFormActionState };

/**
 * Creates a serializable field validation state.
 *
 * @param field - Form field associated with the error.
 * @param message - Error message shown for the field.
 * @returns Serializable action state containing the field error.
 */
function errorState(field: keyof PostFormActionState["errors"], message: string) {
  return { errors: { [field]: message }, message: "Revisa los campos marcados." };
}

/**
 * Extracts non-empty image files from a submitted form.
 *
 * @param formData - Raw values submitted by the post form.
 * @returns Image files included in the submission.
 */
function getFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

/**
 * Builds a stable client-side key for an uploaded file.
 *
 * @param file - Image file to identify.
 * @returns A stable key derived from file metadata.
 */
function getFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Reads optional alternative text values from form data.
 *
 * @param formData - Raw values submitted by the post form.
 * @returns Alternative text indexed by uploaded file key.
 */
function getAltTexts(formData: FormData): Map<string, string> {
  const value = formData.get("imageAlts");

  if (typeof value !== "string") return new Map();

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return new Map();

    return new Map(
      parsed.flatMap((entry) => {
        if (
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          "alt" in entry &&
          typeof entry.id === "string" &&
          typeof entry.alt === "string"
        ) {
          return [[entry.id, entry.alt.trim()]] as const;
        }

        return [];
      }),
    );
  } catch {
    return new Map();
  }
}

/**
 * Resolves the existing media retained by an edit submission.
 *
 * @param formData - Raw values submitted by the post form.
 * @param currentMedia - Media currently persisted for the Post.
 * @returns Existing media selected for retention.
 */
function getExistingMedia(
  formData: FormData,
  currentMedia: readonly PostMedia[],
): PostMedia[] {
  if (!formData.has("existingMedia")) return [...currentMedia];

  const value = formData.get("existingMedia");
  if (typeof value !== "string") return [];

  try {
    const ids: unknown = JSON.parse(value);
    if (!Array.isArray(ids)) return [];

    const retainedIds = new Set(
      ids.filter((id): id is string => typeof id === "string"),
    );
    return currentMedia.filter((media) => retainedIds.has(media.id));
  } catch {
    return [];
  }
}

function getSubmittedKidIds(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];

  try {
    const ids: unknown = JSON.parse(value);
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function haveSameIds(first: readonly string[], second: readonly string[]): boolean {
  return first.length === second.length && first.every((id) => second.includes(id));
}

/**
 * Validates authorization and uploads new images for a post submission.
 *
 * @param formData - Raw values submitted by the post form.
 * @param personId - Authenticated staff member identifier.
 * @param existingMedia - Media already persisted for an edit operation.
 * @returns Authorized post values and uploaded media, or serializable errors.
 */
export async function parsePostSubmission(
  formData: FormData,
  personId: string,
  existingMedia: readonly PostMedia[] = [],
): Promise<ParsedPostSubmission> {
  const files = getFiles(formData);
  const retainedMedia = getExistingMedia(formData, existingMedia);
  const submittedConfirmation = formData.get("restrictionConfirmation");
  const initialValidation = validatePostForm({
    body: formData.get("body"),
    hasImages: files.length > 0 || retainedMedia.length > 0,
    kidIds: getSubmittedKidIds(formData.get("kidIds")),
    media: retainedMedia,
    mode: formData.get("mode"),
    postId: formData.get("postId"),
    roomId: formData.get("roomId"),
    type: formData.get("type"),
  });

  if (!initialValidation.success) {
    return { success: false, state: { errors: initialValidation.errors, message: "Revisa los campos marcados." } };
  }

  const targets = await getPostTargets(
    createPostComposition(),
    { personId, role: "personal" },
  );
  const targetKids = targets.kids.filter((kid) =>
    initialValidation.data.kidIds.includes(kid.id),
  );
  const targetRoom = initialValidation.data.roomId
    ? targets.rooms.find((room) => room.id === initialValidation.data.roomId)
    : undefined;

  const confirmation =
    typeof submittedConfirmation === "string" && submittedConfirmation
      ? verifyRestrictionConfirmationToken(
          submittedConfirmation,
          personId,
          initialValidation.data.postId ?? null,
        )
      : null;

  if (submittedConfirmation && !confirmation) {
    return {
      success: false,
      state: errorState("media", "La confirmación de restricciones ya no es válida."),
    };
  }

  if (
    confirmation &&
    !haveSameIds(
      initialValidation.data.kidIds,
      confirmation.kidIds.filter(
        (kidId) => !confirmation.restrictedKidIds.includes(kidId),
      ),
    )
  ) {
    return {
      success: false,
      state: errorState(
        "destination",
        "El destino de la publicación cambió. Revísalo e inténtalo nuevamente.",
      ),
    };
  }

  if (
    (initialValidation.data.kidIds.length > 0 &&
      targetKids.length !== initialValidation.data.kidIds.length) ||
    (initialValidation.data.kidIds.length === 0 && !targetRoom)
  ) {
    return { success: false, state: errorState("destination", "El destino no está autorizado.") };
  }

  if (targetRoom && (files.length > 0 || retainedMedia.length > 0)) {
    return { success: false, state: errorState("media", "Las publicaciones de sala no admiten imágenes.") };
  }

  for (const file of files) {
    if (
      file.size > MAX_MEDIA_BYTES || !(await isSupportedImageFile(file))
    ) {
      return { success: false, state: errorState("media", "Revisa el formato y tamaño de las imágenes.") };
    }
  }

  if (targetKids.length > 0 && (files.length > 0 || retainedMedia.length > 0)) {
    const consentResults = await Promise.all(
      targetKids.map(async (kid) => ({
        hasConsent: await hasPhotoSharingConsent(createPostComposition(), kid.id),
        kid,
      })),
    );
    const restrictedKids = consentResults
      .filter(({ hasConsent }) => !hasConsent)
      .map(({ kid }) => ({ id: kid.id, name: kid.name }));

    if (restrictedKids.length > 0) {
      const restrictionConfirmation = createRestrictionConfirmationToken({
        kidIds: initialValidation.data.kidIds,
        personId,
        postId: initialValidation.data.postId ?? null,
        restrictedKidIds: restrictedKids.map(({ id }) => id),
      });

      return {
        success: false,
        state: {
          ...errorState(
            "media",
            `Existen niños con restricciones: ${restrictedKids
              .map(({ name }) => name)
              .join(", ")}`,
          ),
          restrictedKids,
          restrictionConfirmation,
        },
      };
    }
  }

  if (files.length + retainedMedia.length > 4) {
    return { success: false, state: errorState("media", "Puedes adjuntar hasta 4 imágenes.") };
  }

  const imageStorage = files.length > 0 ? createPostImageStorage() : null;
  const altTexts = getAltTexts(formData);
  const uploadedMedia: PostMedia[] = [];

  try {
    for (const file of files) {
      const asset = await imageStorage!.upload({
        data: new Uint8Array(await file.arrayBuffer()),
        originalName: file.name,
      });
      uploadedMedia.push({
        ...asset,
        id: randomUUID(),
        originalName: file.name,
        alt: altTexts.get(getFileId(file)) || null,
      });
    }
  } catch {
    let cleanupSucceeded = true;

    if (imageStorage) {
      try {
        await Promise.all(
          uploadedMedia.map((media) =>
            deleteMediaWithRetry(imageStorage, media.publicId),
          ),
        );
      } catch {
        cleanupSucceeded = false;
      }
    }
    return {
      success: false,
      state: {
        errors: {},
        message: cleanupSucceeded
          ? "No pudimos subir las imágenes. Inténtalo nuevamente."
          : "No pudimos subir las imágenes ni limpiar todos los assets. Requiere reintento.",
      },
    };
  }

  const finalMedia = [...retainedMedia, ...uploadedMedia];
  const finalValidation = validatePostForm({ ...initialValidation.data, media: finalMedia, hasImages: finalMedia.length > 0 });

  if (!finalValidation.success) {
    let cleanupSucceeded = true;

    if (imageStorage) {
      try {
        await Promise.all(
          uploadedMedia.map((media) =>
            deleteMediaWithRetry(imageStorage, media.publicId),
          ),
        );
      } catch {
        cleanupSucceeded = false;
      }
    }
    return {
      success: false,
      state: {
        errors: finalValidation.errors,
        message: cleanupSucceeded
          ? "Revisa los campos marcados."
          : "La validación falló y no se pudieron limpiar todos los assets. Requiere reintento.",
      },
    };
  }

  return {
    success: true,
    values: finalValidation.data,
    media: finalMedia,
    uploadedMedia,
  };
}
