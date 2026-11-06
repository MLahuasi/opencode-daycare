import { StaffSidebar } from "@/presentation/layout";
import { FeedContent } from "@/presentation/feed";
import { toggleFeedReactionAction } from "@/app/_actions/posts";
import { getFeedOverview } from "@/composition/feed";
import { getAuthorizedPosts } from "@/application/post";
import { createPostComposition } from "@/composition/post";
import { staffNavigationConfig } from "@/presentation/navigation";
import { requireActiveSession } from "@/composition/auth";
import { getPostViewer } from "@/composition/post";
import { hasRole } from "@/domain/person";
import { redirect } from "next/navigation";
import { getApplicationEnvironment } from "@/config/server";

/**
 * Renders the staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default async function Home() {
  const session = await requireActiveSession();
  const viewer = await getPostViewer(session.user.daycareId, session.user.personId);

  if (hasRole(viewer.roles, "parent")) {
    redirect("/family-feed");
  }

  const feedOverview = await getFeedOverview(session.user.daycareId);
   const feedPosts = await getAuthorizedPosts(
      createPostComposition(session.user.daycareId),
       viewer,
   );
  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar navigation={staffNavigationConfig} />
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
