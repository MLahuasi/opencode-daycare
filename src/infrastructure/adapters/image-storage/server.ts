import "server-only";

import { CloudinaryProvider } from "./cloudinary/cloudinary-provider";

let initializationPromise: Promise<void> | undefined;

async function initializeImageStorageClient(): Promise<void> {
  const provider = new CloudinaryProvider();
  provider.createClient();
}

/** Server-only facade for the configured image-storage client lifecycle. */
export const imageStorageClient = {
  /** Configures Cloudinary once for this server instance. */
  initialize(): Promise<void> {
    initializationPromise ??= initializeImageStorageClient();
    return initializationPromise;
  },
};
