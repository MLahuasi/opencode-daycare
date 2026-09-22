import { readCollection } from "@/app/infrastructure";
import { Invitation } from "../types";

/**
 * Reads the canonical Invitation collection from disk.
 *
 * @returns A freshly parsed, immutable list of Invitations.
 */
export function getInvitations(): Promise<readonly Invitation[]> {
  return readCollection<Invitation>("invitation.json");
}
