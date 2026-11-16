import { StaffSidebar } from "@/presentation/layout";
import { FeedContent } from "@/presentation/feed";
import { toggleFeedReactionAction } from "@/app/_actions/posts";
import { getFeedOverview } from "@/composition/feed";
import { getAuthorizedPosts } from "@/application/post";
import { createPostComposition } from "@/composition/post";
import { createStaffNavigationConfig } from "@/presentation/navigation";
import { createStaffShellComposition } from "@/composition/staff";
import {
  getSessionPersonRoles,
  requireActiveSession,
} from "@/composition/auth";
import { redirect } from "next/navigation";
import { getApplicationEnvironment } from "@/config/server";

/**
 * Renders the staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default async function Home() {
  const session = await requireActiveSession();
  const roles = await getSessionPersonRoles(
    session.user.daycareId,
    session.user.personId,
  );
  const staffNavigation = await createStaffShellComposition().getNavigation(
    session.user.daycareId,
    session.user.personId,
  );

  if (!staffNavigation) {
    redirect("/auth/login");
  }

  if (roles.includes("parent")) {
    redirect("/family-feed");
  }

  const feedOverview = await getFeedOverview(session.user.daycareId);
   const feedPosts = await getAuthorizedPosts(
      createPostComposition(session.user.daycareId),
       { daycareId: session.user.daycareId, personId: session.user.personId, roles },
   );
  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar navigation={createStaffNavigationConfig(staffNavigation)} />
      <FeedContent
        canReact
        commentHref={(postId) => `/posts/${encodeURIComponent(postId)}/comments/new`}
        onToggleReaction={toggleFeedReactionAction}
         overview={feedOverview[0]}
         posts={feedPosts}
         locale={getApplicationEnvironment().locale}
         timeZone={getApplicationEnvironment().timeZone}
       />
    </div>
  );
}
