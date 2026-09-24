import type { FeedMedia, PostType } from "../types";

/** Maximum number of images attached to one post. */
export const MAX_POST_MEDIA = 4;

/** Maximum size of one uploaded image in bytes. */
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

/** Maximum number of characters accepted in a post description. */
export const MAX_POST_BODY_LENGTH = 2000;

const POST_TYPES: readonly PostType[] = [
  "food",
  "nap",
  "activity",
  "achievement",
  "mood",
  "announcement",
];
const MEDIA_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;
const MAX_ALT_LENGTH = 500;

/** Operation mode supported by the post form. */
export type PostFormMode = "create" | "edit";

/** Values normalized by the post form validator. */
export type PostFormValues = {
  mode: PostFormMode;
  postId?: string;
  type: PostType;
  kidId: string | null;
  roomId: string | null;
  body: string;
  media: FeedMedia[];
};

/** Raw values accepted from a create or edit post form. */
export type PostFormInput = Partial<Record<keyof PostFormValues, unknown>> & {
  hasImages?: unknown;
};

/** Field-level validation errors returned by the post form validator. */
export type PostFormErrors = Partial<
  Record<"mode" | "postId" | "type" | "destination" | "body" | "media", string>
>;

/** Result returned after validating post form values. */
export type PostFormValidationResult =
  | { success: true; data: PostFormValues }
  | { success: false; errors: PostFormErrors };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNullableId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validateMediaItem(value: unknown): value is FeedMedia {
  if (!isRecord(value)) {
    return false;
  }

  const altIsValid =
    value.alt === null ||
    (typeof value.alt === "string" && value.alt.length <= MAX_ALT_LENGTH);
  const width = value.width;
  const height = value.height;
  const bytes = value.bytes;

  return (
    typeof value.id === "string" &&
    typeof value.publicId === "string" &&
    typeof value.assetId === "string" &&
    value.resourceType === "image" &&
    value.deliveryType === "authenticated" &&
    typeof value.format === "string" &&
    MEDIA_FORMATS.includes(value.format as (typeof MEDIA_FORMATS)[number]) &&
    typeof width === "number" &&
    typeof height === "number" &&
    typeof bytes === "number" &&
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    Number.isInteger(bytes) &&
    width > 0 &&
    height > 0 &&
    bytes > 0 &&
    bytes <= MAX_MEDIA_BYTES &&
    typeof value.originalName === "string" &&
    Boolean(value.originalName.trim()) &&
    altIsValid
  );
}

function validateMedia(value: unknown): { value: FeedMedia[]; error?: string } {
  if (value === undefined || value === null) {
    return { value: [] };
  }

  if (!Array.isArray(value)) {
    return { value: [], error: "Las imágenes no son válidas." };
  }

  if (value.length > MAX_POST_MEDIA) {
    return {
      value: [],
      error: `Puedes adjuntar hasta ${MAX_POST_MEDIA} imágenes.`,
    };
  }

  if (!value.every(validateMediaItem)) {
    return { value: [], error: "Revisa el formato y los metadatos de las imágenes." };
  }

  return { value: value as FeedMedia[] };
}

/**
 * Validates and normalizes a post create or edit payload.
 *
 * @param input - Raw values collected from the post form or server action.
 * @returns Normalized post values or field-level errors.
 */
export function validatePostForm(
  input: PostFormInput,
): PostFormValidationResult {
  const errors: PostFormErrors = {};
  const mode = input.mode === "create" || input.mode === "edit" ? input.mode : null;
  const type = POST_TYPES.includes(input.type as PostType)
    ? (input.type as PostType)
    : null;
  const postId = normalizeNullableId(input.postId);
  const kidId = normalizeNullableId(input.kidId);
  const roomId = normalizeNullableId(input.roomId);
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const media = validateMedia(input.media);
  const hasImages = input.hasImages === true || media.value.length > 0;

  if (!mode) errors.mode = "Selecciona un modo de publicación válido.";
  if (!type) errors.type = "Selecciona un tipo de publicación.";
  if (mode === "edit" && !postId) {
    errors.postId = "Indica la publicación que deseas editar.";
  }
  if (Boolean(kidId) === Boolean(roomId)) {
    errors.destination = "Selecciona exactamente un niño o una sala.";
  }
  if (typeof input.body !== "string" && !hasImages) {
    errors.body = "La descripción es obligatoria cuando no hay imágenes.";
  } else if (body.length > MAX_POST_BODY_LENGTH) {
    errors.body = `La descripción no puede superar los ${MAX_POST_BODY_LENGTH} caracteres.`;
  }
  if (media.error) errors.media = media.error;
  if (!body && !hasImages) {
    errors.body = "Agrega una descripción o al menos una imagen.";
  }

  if (Object.keys(errors).length > 0 || !mode || !type) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      mode,
      ...(postId ? { postId } : {}),
      type,
      kidId,
      roomId,
      body,
      media: media.value,
    },
  };
}
