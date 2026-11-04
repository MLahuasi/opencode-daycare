import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnvironment } from "@/config/server";

/** Configures the Cloudinary SDK without performing a remote operation. */
export class CloudinaryProvider {
  /** Creates the configured Cloudinary client state. */
  createClient(): void {
    const { url } = getCloudinaryEnvironment();
    const cloudinaryUrl = new URL(url);

    cloudinary.config({
      cloud_name: cloudinaryUrl.hostname,
      api_key: decodeURIComponent(cloudinaryUrl.username),
      api_secret: decodeURIComponent(cloudinaryUrl.password),
      secure: true,
    });
  }
}
