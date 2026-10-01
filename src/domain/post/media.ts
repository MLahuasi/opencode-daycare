/** Supported formats for authenticated Post media. */
export type PostMediaFormat = "jpg" | "jpeg" | "png" | "webp";

/** Cloudinary metadata persisted for a Post image. */
export type PostMedia = {
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

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const MAX_ALT_LENGTH = 500;

/**
 * Checks whether media metadata satisfies the Post media invariants.
 *
 * @param media - Media metadata to validate.
 * @returns Whether the media item is valid.
 */
export function isValidPostMedia(media: PostMedia): boolean {
  return (
    media.id.trim().length > 0 &&
    media.publicId.trim().length > 0 &&
    media.assetId.trim().length > 0 &&
    media.resourceType === "image" &&
    media.deliveryType === "authenticated" &&
    media.width > 0 &&
    media.height > 0 &&
    media.bytes > 0 &&
    media.bytes <= MAX_MEDIA_BYTES &&
    Number.isInteger(media.width) &&
    Number.isInteger(media.height) &&
    Number.isInteger(media.bytes) &&
    media.originalName.trim().length > 0 &&
    (media.alt === null || media.alt.length <= MAX_ALT_LENGTH)
  );
}

/**
 * Checks whether a Post has an allowed number of media items.
 *
 * @param media - Media collection attached to the Post.
 * @returns Whether the collection respects the Post media limit.
 */
export function hasValidPostMediaCount(media: readonly PostMedia[]): boolean {
  return media.length <= 4 && media.every(isValidPostMedia);
}
