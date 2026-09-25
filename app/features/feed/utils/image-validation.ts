const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

function hasSupportedExtension(file: File): boolean {
  return (
    ACCEPTED_EXTENSIONS.test(file.name) &&
    (!file.type || ACCEPTED_MIME_TYPES.has(file.type))
  );
}

/**
 * Validates the declared metadata and binary signature of a supported image.
 *
 * @param file - Image file selected by the user or received by the server.
 * @returns Whether the file is a JPEG, PNG, or WebP with a matching signature.
 */
export async function isSupportedImageFile(file: File): Promise<boolean> {
  if (!hasSupportedExtension(file)) return false;

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isJpeg = extension === "jpg" || extension === "jpeg";
  const isPng = extension === "png";
  const isWebp = extension === "webp";

  return (
    (isJpeg && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (isPng &&
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a) ||
    (isWebp &&
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50)
  );
}
