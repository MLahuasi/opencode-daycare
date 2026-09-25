import { readCollection } from "@/app/infrastructure";
import { Credential } from "@/app/features/auth/types";

/**
 * Reads the canonical Credential collection from disk.
 *
 * @returns A freshly parsed, immutable list of Credentials.
 */
export function getCredentials(): Promise<readonly Credential[]> {
  return readCollection<Credential>("credential.json");
}
