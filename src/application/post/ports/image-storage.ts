/** Image bytes and source metadata accepted by the Post media port. */
export type PostImageUploadInput = {
  data: Uint8Array;
  originalName: string;
};

/** Provider-agnostic asset metadata returned by Post media storage. */
export type PostImageAsset = {
  assetId: string;
  publicId: string;
  resourceType: "image";
  deliveryType: "authenticated";
  format: "jpg" | "jpeg" | "png" | "webp";
  width: number;
  height: number;
  bytes: number;
};

/** Media storage capabilities required by Post use cases. */
export interface PostImageStorage {
  /**
   * Uploads an authenticated image.
   *
   * @param input - Image bytes and original filename.
   * @returns Persistable asset metadata.
   */
  upload(input: PostImageUploadInput): Promise<PostImageAsset>;
  /**
   * Builds a delivery URL for a stored image.
   *
   * @param asset - Persisted image asset metadata.
   * @returns A delivery URL for the image.
   */
  getUrl(asset: PostImageAsset): string;
  /**
   * Deletes a stored image.
   *
   * @param publicId - Provider public identifier of the image.
   * @returns A promise that resolves after deletion completes.
   */
  delete(publicId: string): Promise<void>;
}
