import { StaffSidebar } from "@/app/components/layout";
import { FeedContent } from "@/app/features/feed";
import { getFeedOverview, getFeeds } from "@/app/features/feed/services";
import {
  FamilyFeedContent,
  FamilyHeader,
} from "@/app/features/family";
import {
  getAuthenticatedFamilyContext,
  getFamilyFeed,
} from "@/app/features/family/server";
import { staffNavigationConfig } from "@/app/shared/config";
import { requireActiveSession } from "@/auth";

/**
 * Renders the staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default async function Home() {
  const session = await requireActiveSession();

  if (session.user.role === "parent") {
    const [familyContext, familyPosts] = await Promise.all([
      getAuthenticatedFamilyContext(),
      getFamilyFeed(),
    ]);

    return (
      <div className="min-h-screen bg-background text-foreground">
        <FamilyHeader kids={familyContext.kids} person={familyContext.person} />
        <FamilyFeedContent posts={familyPosts} />
      </div>
    );
  }

  const feedOverview = await getFeedOverview();
  const feedPosts = await getFeeds();
  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar navigation={staffNavigationConfig} />
      <FeedContent overview={feedOverview[0]} posts={feedPosts} />
    </div>
  );
}
