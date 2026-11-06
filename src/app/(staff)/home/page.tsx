import { StaffSidebar } from "@/presentation/layout";
import { FeedContent } from "@/presentation/feed";
import { toggleFeedReactionAction } from "@/app/_actions/posts";
import { getAuthorizedPosts } from "@/application/post";
import { createPostComposition } from "@/composition/post";
import { getStaffNavigation } from "@/composition/staff-shell";
import { requireActiveSession } from "@/composition/auth";
import { getPostViewer } from "@/composition/post";
import { hasRole } from "@/domain/person";
import { redirect } from "next/navigation";
import { getApplicationEnvironment } from "@/config/server";

function createFeedOverview(
  name: string,
  roomLabel: string,
  activeKidCount: number,
  locale: string,
  timeZone: string,
) {
  const firstName = name.trim().split(/\s+/)[0] || name;
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
  }).format(new Date());

  return {
    roomLabel,
    greeting: `Hola, ${firstName}!`,
    attendance: `${activeKidCount} ${activeKidCount === 1 ? "niño" : "niños"}`,
    date,
    composerPrompt: "Comparte algo con tu equipo...",
    publishedTodayLabel: "PUBLICADO HOY",
  };
}

/**
 * Renders the staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default async function Home() {
  const session = await requireActiveSession();
  const viewer = await getPostViewer(session.user.daycareId, session.user.personId);
  const navigation = await getStaffNavigation(
    session.user.daycareId,
    session.user.personId,
  );

  if (!navigation) redirect("/auth/login");

  if (hasRole(viewer.roles, "parent")) {
    redirect("/family-feed");
  }

  const postComposition = createPostComposition(session.user.daycareId);
  const [kids, feedPosts] = await Promise.all([
    postComposition.kids.findAll(),
    getAuthorizedPosts(postComposition, viewer),
  ]);
  const environment = getApplicationEnvironment();
  const feedOverview = createFeedOverview(
    navigation.profile.name,
    navigation.brand.room,
    kids.filter((kid) => kid.status === "active").length,
    environment.locale,
    environment.timeZone,
  );
  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar navigation={navigation} />
      <FeedContent
        canReact
        commentHref={(postId) => `/posts/${encodeURIComponent(postId)}/comments/new`}
        onToggleReaction={toggleFeedReactionAction}
         overview={feedOverview}
         posts={feedPosts}
         locale={environment.locale}
         timeZone={environment.timeZone}
       />
    </div>
  );
}
