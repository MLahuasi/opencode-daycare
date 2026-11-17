import { StaffSidebar } from "@/presentation/layout";
import { FeedContent } from "@/presentation/feed";
import { toggleFeedReactionAction } from "@/app/_actions/posts";
import { getAuthorizedPosts } from "@/application/post";
import { createPostComposition } from "@/composition/post";
import { createStaffNavigationConfig } from "@/presentation/navigation";
import { createStaffShellComposition } from "@/composition/staff";
import {
  getSessionPersonRoles,
  requireStaffSession,
} from "@/composition/auth";
import { redirect } from "next/navigation";
import { getApplicationEnvironment } from "@/config/server";

/**
 * Renders the staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default async function Home() {
  const session = await requireStaffSession();
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

  const postComposition = createPostComposition(session.user.daycareId);
  const environment = getApplicationEnvironment();
  const [kids, feedPosts] = await Promise.all([
    postComposition.kids.findAll(),
    getAuthorizedPosts(
      postComposition,
      { daycareId: session.user.daycareId, personId: session.user.personId, roles },
    ),
  ]);
  const activeKids = kids.filter((kid) => kid.status === "active");
  const overview = {
    roomLabel: staffNavigation.brand.room,
    greeting: `Hola, ${staffNavigation.profile.name}`,
    attendance: `${activeKids.length} ${activeKids.length === 1 ? "niño" : "niños"}`,
    date: new Intl.DateTimeFormat(environment.locale, {
      dateStyle: "long",
      timeZone: environment.timeZone,
    }).format(new Date()),
    composerPrompt: "Comparte un momento del día",
    publishedTodayLabel: "PUBLICADO HOY",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar navigation={createStaffNavigationConfig(staffNavigation)} />
      <FeedContent
        canReact
        commentHref={(postId) => `/posts/${encodeURIComponent(postId)}/comments/new`}
        onToggleReaction={toggleFeedReactionAction}
          overview={overview}
          posts={feedPosts}
          locale={environment.locale}
          timeZone={environment.timeZone}
       />
    </div>
  );
}
