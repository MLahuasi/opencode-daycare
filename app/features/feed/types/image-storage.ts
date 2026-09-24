/** Image bytes and source metadata accepted by the feed media port. */
export type ImageUploadInput = {
  data: Uint8Array;
  originalName: string;
};

/** Persistable metadata returned by an image storage provider. */
export type ImageAsset = {
  assetId: string;
  publicId: string;
  resourceType: "image";
  deliveryType: "authenticated";
  format: "jpg" | "jpeg" | "png" | "webp";
  width: number;
  height: number;
  bytes: number;
};

/** Provider-agnostic port used by feed business logic for image storage. */
export interface ImageStorage {
  upload(input: ImageUploadInput): Promise<ImageAsset>;
  getUrl(asset: ImageAsset): string;
  delete(publicId: string): Promise<void>;
}
