import type { ImageStorage } from "../types";

/**
 * Deletes a provider asset with bounded retries for transient failures.
 *
 * @param storage - Injected image storage implementation.
 * @param publicId - Provider public ID to delete.
 * @returns A promise that resolves after deletion or rejects after retries.
 */
export async function deleteMediaWithRetry(
  storage: ImageStorage,
  publicId: string,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await storage.delete(publicId);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Could not delete media ${publicId}.`);
}
