import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type {
  ImageAsset,
  ImageStorage,
  ImageUploadInput,
} from "@/app/features/feed";

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
  format: ImageAsset["format"];
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
  upload(
    data: Uint8Array,
    options: CloudinaryUploadOptions,
  ): Promise<UploadApiResponse>;
  url(publicId: string, options: CloudinaryUrlOptions): string;
  destroy(
    publicId: string,
    options: CloudinaryDestroyOptions,
  ): Promise<{ result?: string }>;
};

function ensureCloudinaryConfiguration(): void {
  if (!process.env.CLOUDINARY_URL?.trim()) {
    throw new Error("CLOUDINARY_URL is required for image operations.");
  }

  cloudinary.config({ secure: true });
}

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

function toImageAsset(result: UploadApiResponse): ImageAsset {
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
    format: result.format as ImageAsset["format"],
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

/**
 * Cloudinary implementation of the provider-agnostic image storage port.
 *
 * @param gateway - Cloudinary operations injected by the composition root.
 */
export class CloudinaryImageStorage implements ImageStorage {
  public constructor(private readonly gateway: CloudinaryGateway) {}

  /**
   * Uploads an image as an authenticated Cloudinary asset.
   *
   * @param input - Image bytes and original filename.
   * @returns Persistable Cloudinary asset metadata.
   */
  public async upload(input: ImageUploadInput): Promise<ImageAsset> {
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
   * @param asset - Persisted image metadata.
   * @returns A secure signed Cloudinary URL.
   */
  public getUrl(asset: ImageAsset): string {
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
   * @param publicId - Persisted Cloudinary public ID.
   * @returns A promise that resolves after deletion.
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
 * @returns An image storage port backed by Cloudinary.
 */
export function createCloudinaryImageStorage(): ImageStorage {
  return new CloudinaryImageStorage(createCloudinaryGateway());
}
