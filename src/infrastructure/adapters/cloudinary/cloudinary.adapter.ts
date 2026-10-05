import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type {
  PostImageAsset,
  PostImageStorage,
  PostImageUploadInput,
} from "@/application/post/ports";

const SUPPORTED_IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);

type CloudinaryUploadOptions = {
  folder: string;
  resource_type: "image";
  type: "authenticated";
  unique_filename: boolean;
  use_filename: boolean;
  filename_override: string;
};

type CloudinaryUrlOptions = {
  secure: boolean;
  sign_url: boolean;
  type: "authenticated";
  resource_type: "image";
  format: PostImageAsset["format"];
  width: number;
  height: number;
  crop: "fill";
  gravity: "auto";
  quality: "auto";
  fetch_format: "auto";
};

type CloudinaryDestroyOptions = {
  resource_type: "image";
  type: "authenticated";
  invalidate: boolean;
};

/** Minimal Cloudinary gateway required by the provider adapter. */
export type CloudinaryGateway = {
  /**
   * Uploads image bytes using Cloudinary options.
   *
   * @param data - Image bytes to upload.
   * @param options - Provider upload options.
   * @returns The Cloudinary upload response.
   */
  upload(
    data: Uint8Array,
    options: CloudinaryUploadOptions,
  ): Promise<UploadApiResponse>;
  /**
   * Builds a Cloudinary delivery URL.
   *
   * @param publicId - Cloudinary public identifier.
   * @param options - Provider URL options.
   * @returns The generated delivery URL.
   */
  url(publicId: string, options: CloudinaryUrlOptions): string;
  /**
   * Removes a Cloudinary asset.
   *
   * @param publicId - Cloudinary public identifier.
   * @param options - Provider deletion options.
   * @returns The Cloudinary deletion result.
   */
  destroy(
    publicId: string,
    options: CloudinaryDestroyOptions,
  ): Promise<{ result?: string }>;
};

/**
 * Validates the Cloudinary configuration and enables secure URLs.
 *
 * @returns Nothing when the provider is configured.
 * @throws Error when `CLOUDINARY_URL` is missing.
 */
function ensureCloudinaryConfiguration(): void {
  if (!process.env.CLOUDINARY_URL?.trim()) {
    throw new Error("CLOUDINARY_URL is required for image operations.");
  }

  cloudinary.config({ secure: true });
}

/**
 * Creates a gateway backed by the configured Cloudinary SDK.
 *
 * @returns A gateway exposing the provider operations used by the adapter.
 */
function createCloudinaryGateway(): CloudinaryGateway {
  ensureCloudinaryConfiguration();

  return {
    upload(data, options) {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, response) => {
          if (error || !response) {
            reject(error ?? new Error("Cloudinary upload returned no response."));
            return;
          }

          resolve(response);
        });

        uploadStream.end(data);
      });
    },
    url(publicId, options) {
      return cloudinary.url(publicId, options);
    },
    destroy(publicId, options) {
      return cloudinary.uploader.destroy(publicId, options);
    },
  };
}

/**
 * Converts a Cloudinary upload response to the Post media contract.
 *
 * @param result - Provider response returned after an upload.
 * @returns Persistable authenticated image metadata.
 * @throws Error when the provider response is not a supported image asset.
 */
function toImageAsset(result: UploadApiResponse): PostImageAsset {
  if (
    result.resource_type !== "image" ||
    result.type !== "authenticated" ||
    !SUPPORTED_IMAGE_FORMATS.has(result.format)
  ) {
    throw new Error("Cloudinary returned an unsupported image asset.");
  }

  return {
    assetId: String(result.asset_id),
    publicId: result.public_id,
    resourceType: "image",
    deliveryType: "authenticated",
    format: result.format as PostImageAsset["format"],
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

/** Cloudinary implementation of the Post media storage port. */
export class CloudinaryImageStorage implements PostImageStorage {
  /**
   * Creates a Cloudinary media adapter.
   *
   * @param gateway - Cloudinary operations injected by the composition root.
   */
  public constructor(private readonly gateway: CloudinaryGateway) {}

  /**
   * Uploads an image as an authenticated Cloudinary asset.
   *
   * @param input - Image bytes and original filename.
   * @returns Persistable Cloudinary asset metadata.
   */
  public async upload(input: PostImageUploadInput): Promise<PostImageAsset> {
    const result = await this.gateway.upload(input.data, {
      folder: "daycare/posts",
      resource_type: "image",
      type: "authenticated",
      unique_filename: true,
      use_filename: false,
      filename_override: input.originalName,
    });

    return toImageAsset(result);
  }

  /**
   * Generates a permanent signed delivery URL for an authenticated image.
   *
   * @param asset - Persisted Cloudinary image metadata.
   * @returns A secure signed Cloudinary URL.
   */
  public getUrl(asset: PostImageAsset): string {
    return this.gateway.url(asset.publicId, {
      secure: true,
      sign_url: true,
      type: "authenticated",
      resource_type: "image",
      format: asset.format,
      width: 800,
      height: 600,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
      fetch_format: "auto",
    });
  }

  /**
   * Permanently removes an authenticated image from Cloudinary.
   *
   * @param publicId - Persisted Cloudinary public identifier.
   * @returns A promise that resolves after deletion completes.
   */
  public async delete(publicId: string): Promise<void> {
    const result = await this.gateway.destroy(publicId, {
      resource_type: "image",
      type: "authenticated",
      invalidate: true,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary could not delete image ${publicId}.`);
    }
  }
}

/**
 * Creates the configured Cloudinary storage implementation.
 *
 * @returns A Post image storage port backed by Cloudinary.
 */
export function createCloudinaryImageStorage(): PostImageStorage {
  return new CloudinaryImageStorage(createCloudinaryGateway());
}
