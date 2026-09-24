import { randomUUID } from "node:crypto";
import { createCloudinaryImageStorage } from "@/app/infrastructure";
import { readCollection } from "@/app/infrastructure/persistence";
import type { Person } from "@/app/features/people";
import type { ParentKid } from "@/app/features/family";
import {
  MAX_MEDIA_BYTES,
  validatePostForm,
  type PostFormValues,
} from "../schemas";
import type { PostFormActionState } from "./types";
import { getAuthorizedPostTargets } from "../services";
import type { FeedMedia } from "../types";

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

type ParsedPostSubmission =
  | {
      success: true;
      values: PostFormValues;
      media: FeedMedia[];
      uploadedMedia: FeedMedia[];
      subject: string;
    }
  | { success: false; state: PostFormActionState };

function errorState(field: keyof PostFormActionState["errors"], message: string) {
  return { errors: { [field]: message }, message: "Revisa los campos marcados." };
}

function getFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function getFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

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

function getExistingMedia(
  formData: FormData,
  currentMedia: readonly FeedMedia[],
): FeedMedia[] {
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

async function validateConsent(kidId: string): Promise<boolean> {
  const [parentKids, people] = await Promise.all([
    readCollection<ParentKid>("parent-kids.json"),
    readCollection<Person>("people.json"),
  ]);
  const activeParentIds = new Set(
    people
      .filter((person) => person.role === "parent" && person.status === "active")
      .map((person) => person.id),
  );
  const linkedActiveParents = parentKids.filter(
    (parentKid) =>
      parentKid.kidId === kidId && activeParentIds.has(parentKid.parentId),
  );

  return linkedActiveParents.every((parentKid) => parentKid.photoSharingConsent);
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
  existingMedia: readonly FeedMedia[] = [],
): Promise<ParsedPostSubmission> {
  const files = getFiles(formData);
  const retainedMedia = getExistingMedia(formData, existingMedia);
  const initialValidation = validatePostForm({
    body: formData.get("body"),
    hasImages: files.length > 0 || retainedMedia.length > 0,
    kidId: formData.get("kidId"),
    media: retainedMedia,
    mode: formData.get("mode"),
    postId: formData.get("postId"),
    roomId: formData.get("roomId"),
    type: formData.get("type"),
  });

  if (!initialValidation.success) {
    return { success: false, state: { errors: initialValidation.errors, message: "Revisa los campos marcados." } };
  }

  const targets = await getAuthorizedPostTargets(personId);
  const targetKid = initialValidation.data.kidId
    ? targets.kids.find((kid) => kid.id === initialValidation.data.kidId)
    : undefined;
  const targetRoom = initialValidation.data.roomId
    ? targets.rooms.find((room) => room.id === initialValidation.data.roomId)
    : undefined;

  if (!targetKid && !targetRoom) {
    return { success: false, state: errorState("destination", "El destino no está autorizado.") };
  }

  if (targetRoom && (files.length > 0 || retainedMedia.length > 0)) {
    return { success: false, state: errorState("media", "Las publicaciones de sala no admiten imágenes.") };
  }

  for (const file of files) {
    if (
      (!ACCEPTED_MIME_TYPES.has(file.type) && !ACCEPTED_EXTENSIONS.test(file.name)) ||
      file.size > MAX_MEDIA_BYTES
    ) {
      return { success: false, state: errorState("media", "Revisa el formato y tamaño de las imágenes.") };
    }
  }

  if (targetKid && files.length > 0 && !(await validateConsent(targetKid.id))) {
    return { success: false, state: errorState("media", "No hay consentimiento vigente de todas las familias activas.") };
  }

  if (files.length + retainedMedia.length > 4) {
    return { success: false, state: errorState("media", "Puedes adjuntar hasta 4 imágenes.") };
  }

  const imageStorage = files.length > 0 ? createCloudinaryImageStorage() : null;
  const altTexts = getAltTexts(formData);
  const uploadedMedia: FeedMedia[] = [];

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
    await Promise.allSettled(
      uploadedMedia.map((media) => imageStorage?.delete(media.publicId)),
    );
    return { success: false, state: { errors: {}, message: "No pudimos subir las imágenes. Inténtalo nuevamente." } };
  }

  const finalMedia = [...retainedMedia, ...uploadedMedia];
  const finalValidation = validatePostForm({ ...initialValidation.data, media: finalMedia, hasImages: finalMedia.length > 0 });

  if (!finalValidation.success) {
    await Promise.allSettled(
      uploadedMedia.map((media) => imageStorage?.delete(media.publicId)),
    );
    return { success: false, state: { errors: finalValidation.errors, message: "Revisa los campos marcados." } };
  }

  return {
    success: true,
    values: finalValidation.data,
    media: finalMedia,
    uploadedMedia,
    subject: targetKid?.name ?? targetRoom?.name ?? "Anuncio general",
  };
}
