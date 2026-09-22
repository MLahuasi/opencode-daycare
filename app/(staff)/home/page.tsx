import { StaffSidebar } from "@/app/components/layout";
import { feedOverview, feedPosts } from "@/app/data/mocks";
import { FeedContent } from "@/app/features/feed";
import { staffNavigationConfig } from "@/app/shared/config";

/**
 * Renders the staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen bg-[var(--color-page)]">
      <StaffSidebar navigation={staffNavigationConfig} />
      <FeedContent overview={feedOverview} posts={feedPosts} />
    </div>
  );
}
