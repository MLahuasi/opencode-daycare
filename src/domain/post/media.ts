import type { DaycareScoped } from "@/domain/daycare";

/** Supported formats for authenticated Post media. */
export type PostMediaFormat = "jpg" | "jpeg" | "png" | "webp";

/** Cloudinary metadata persisted for a Post image. */
export type PostMedia = DaycareScoped & {
  id: string;
  publicId: string;
  assetId: string;
  resourceType: "image";
  deliveryType: "authenticated";
  format: PostMediaFormat;
  width: number;
  height: number;
  bytes: number;
  originalName: string;
  alt: string | null;
  url?: string;
};

export type PostMediaValidationLimits = {
  maxImageBytes: number;
  maxAltLength: number;
  maxImagesPerOperation: number;
};

/**
 * Checks whether media metadata satisfies the Post media invariants.
 *
 * @param media - Media metadata to validate.
 * @returns Whether the media item is valid.
 */
export function isValidPostMedia(
  media: PostMedia,
  limits: PostMediaValidationLimits,
): boolean {
  return (
    media.id.trim().length > 0 &&
    media.publicId.trim().length > 0 &&
    media.assetId.trim().length > 0 &&
    media.resourceType === "image" &&
    media.deliveryType === "authenticated" &&
    media.width > 0 &&
    media.height > 0 &&
    media.bytes > 0 &&
    media.bytes <= limits.maxImageBytes &&
    Number.isInteger(media.width) &&
    Number.isInteger(media.height) &&
    Number.isInteger(media.bytes) &&
    media.originalName.trim().length > 0 &&
    (media.alt === null || media.alt.length <= limits.maxAltLength)
  );
}

/**
 * Checks whether a Post has an allowed number of media items.
 *
 * @param media - Media collection attached to the Post.
 * @returns Whether the collection respects the Post media limit.
 */
export function hasValidPostMediaCount(
  media: readonly PostMedia[],
  limits: PostMediaValidationLimits,
): boolean {
  return (
    media.length <= limits.maxImagesPerOperation &&
    media.every((item) => isValidPostMedia(item, limits))
  );
}
