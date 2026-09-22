import "server-only";

import { getKidById } from "@/app/features/kids/server";
import type { LinkParentKid } from "../types";

/**
 * Resolves the kid data required by the parent-link invitation screen.
 *
 * @param kidId - Stable identifier of the kid to load.
 * @returns The projected kid data, or `null` when the kid does not exist.
 */
export async function getLinkParentKid(
  kidId: string,
): Promise<LinkParentKid | null> {
  const kid = await getKidById(kidId);

  if (!kid) {
    return null;
  }

  return {
    id: kid.id,
    name: kid.name,
    slug: kid.slug,
  };
}
