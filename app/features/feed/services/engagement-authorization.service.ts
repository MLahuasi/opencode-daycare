import "server-only";

import { requireActiveSession } from "@/auth";
import { getFamilyFeedProjection } from "@/src/application/family/feed";
import { getAuthorizedPosts } from "@/src/application/post";
import { createFamilyFeedComposition } from "@/src/composition/family";
import { createPostComposition } from "@/src/composition/post";

/**
 * Loads the Posts that the authenticated person can use for engagement.
 *
 * @returns Posts authorized for the current family or staff account.
 */
export async function getAuthorizedEngagementPosts() {
  const session = await requireActiveSession();

  if (session.user.role === "parent") {
    const projection = await getFamilyFeedProjection(
      createFamilyFeedComposition(),
      session.user.personId,
    );
    return projection.posts;
  }

  return getAuthorizedPosts(
    createPostComposition(),
    { personId: session.user.personId, role: session.user.role },
  );
}
