import { notFound } from "next/navigation";
import { requireActiveSession } from "@/composition/auth";
import { deleteFeedCommentAction } from "@/app/_actions/posts";
import { getFamilyFeedContext } from "@/application/family/feed";
import { getPostDetail } from "@/application/post";
import { PostDetailView } from "@/presentation/post";
import { FamilySidebar, StaffSidebar } from "@/presentation/layout";
import { createFamilyFeedComposition } from "@/composition/family";
import { createPostComposition, getPostViewer } from "@/composition/post";
import { getStaffNavigation } from "@/composition/staff-shell";
import { presentPostDetail } from "@/presentation/post";
import { getApplicationEnvironment } from "@/config/server";
import { hasCapability } from "@/domain/person";

/** Dynamic parameters accepted by the general Post detail route. */
type PostDetailPageProps = {
  /** Promise containing the canonical Post identifier. */
  params: Promise<{ postId: string }>;
};

/**
 * Renders an authorized Post detail for staff or family accounts.
 *
 * @param props - Dynamic detail route parameters.
 * @param props.params - Promise containing the requested Post identifier.
 * @returns The role-specific Post detail view or the not-found boundary.
 */
export default async function PostDetailPage({
  params,
}: PostDetailPageProps) {
  const session = await requireActiveSession();
  const { postId } = await params;
  const viewer = await getPostViewer(session.user.daycareId, session.user.personId);
   const detail = await getPostDetail(
     createPostComposition(session.user.daycareId),
     postId,
       viewer,
   );

   if (!detail) {
     notFound();
   }
   const environment = getApplicationEnvironment();
   const viewModel = presentPostDetail(detail, environment.locale, environment.timeZone);

  if (!hasCapability(viewer.roles, "staff-shell")) {
    const familyContext = await getFamilyFeedContext(
       createFamilyFeedComposition(session.user.daycareId),
      session.user.personId,
    );

    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <FamilySidebar person={familyContext.person} />
        <PostDetailView
          backHref="/family-feed"
          className="min-w-0 flex-1"
          deleteCommentAction={deleteFeedCommentAction}
          detail={viewModel}
          viewerPersonId={session.user.personId}
        />
      </div>
    );
  }

  const navigation = await getStaffNavigation(
    session.user.daycareId,
    session.user.personId,
  );
  if (!navigation) notFound();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <StaffSidebar navigation={navigation} />
      <PostDetailView
        backHref="/home"
        className="min-w-0 flex-1"
        deleteCommentAction={deleteFeedCommentAction}
        detail={viewModel}
        viewerPersonId={session.user.personId}
      />
    </div>
  );
}
