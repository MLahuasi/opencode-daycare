import { StaffSidebar } from "@/app/components/layout";
import { FeedContent } from "@/app/features/feed";
import { getFeedOverview, getFeeds } from "@/app/features/feed/services";
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-3xl font-semibold">Tu espacio familiar</h1>
          <p className="mt-3 text-base">Pronto podrás ver aquí las novedades de tus hijos.</p>
        </div>
      </main>
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
