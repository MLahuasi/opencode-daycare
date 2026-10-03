import "server-only";

import { requireActiveSession } from "@/auth";
import { getFamilyFeedProjection } from "@/src/application/family/feed";
import { createFamilyFeedComposition } from "@/src/infrastructure/composition/family";
import { getFeeds } from "./feed.service";

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

  return getFeeds({
    resolveMediaUrls: false,
    viewerId: session.user.personId,
  });
}
