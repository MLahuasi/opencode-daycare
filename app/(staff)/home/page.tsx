import { StaffSidebar } from "@/app/components/layout";
import { FeedContent } from "@/app/features/feed";
import { getFeedOverview, getFeeds } from "@/app/features/feed/services";
import { staffNavigationConfig } from "@/app/shared/config";

/**
 * Renders the staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default async function Home() {
  const feedOverview = await getFeedOverview();
  const feedPosts = await getFeeds();
  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar navigation={staffNavigationConfig} />
      <FeedContent overview={feedOverview[0]} posts={feedPosts} />
    </div>
  );
}
