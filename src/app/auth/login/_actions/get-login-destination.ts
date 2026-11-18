"use server";

import { getSessionPersonRoles, requireActiveSession } from "@/composition/auth";
import { hasPersonRole } from "@/domain/person";

/**
 * Resolves the first route an authenticated person can access after login.
 *
 * @returns The family feed for parents, or the staff home for other accounts.
 */
export async function getLoginDestination(): Promise<"/family-feed" | "/home"> {
  const session = await requireActiveSession();
  const roles = await getSessionPersonRoles(
    session.user.daycareId,
    session.user.personId,
  );

  return hasPersonRole(roles, "parent") ? "/family-feed" : "/home";
}
