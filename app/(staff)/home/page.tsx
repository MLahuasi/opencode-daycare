import { StaffSidebar } from "@/src/presentation/layout";
import { FeedContent } from "@/src/presentation/feed";
import { toggleFeedReactionAction } from "@/app/_actions/posts";
import { getFeedOverview } from "@/src/composition/feed";
import { getAuthorizedPosts } from "@/src/application/post";
import { createPostComposition } from "@/src/composition/post";
import { staffNavigationConfig } from "@/src/presentation/navigation";
import { requireActiveSession } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Renders the staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default async function Home() {
  const session = await requireActiveSession();

  if (session.user.role === "parent") {
    redirect("/family-feed");
  }

  const feedOverview = await getFeedOverview();
   const feedPosts = await getAuthorizedPosts(
     createPostComposition(),
     { personId: session.user.personId, role: session.user.role },
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
      />
    </div>
  );
}
