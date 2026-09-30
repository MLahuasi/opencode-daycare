import { StaffSidebar } from "@/src/components/layout";
import { FeedContent } from "@/app/features/feed";
import { toggleFeedReactionAction } from "@/app/features/family/server";
import { getFeedOverview, getFeeds } from "@/app/features/feed/services";
import { staffNavigationConfig } from "@/src/config";
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
  const feedPosts = await getFeeds();
  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar navigation={staffNavigationConfig} />
      <FeedContent
        canReact
        commentHref={(postId) => `/post-comment/new?postId=${encodeURIComponent(postId)}`}
        onToggleReaction={toggleFeedReactionAction}
        overview={feedOverview[0]}
        posts={feedPosts}
      />
    </div>
  );
}
