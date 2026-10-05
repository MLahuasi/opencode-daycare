import { notFound } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { deleteFeedCommentAction } from "@/app/_actions/posts";
import { getFamilyFeedContext } from "@/application/family/feed";
import { getPostDetail } from "@/application/post";
import { PostDetailView } from "@/presentation/post";
import { FamilySidebar, StaffSidebar } from "@/presentation/layout";
import { staffNavigationConfig } from "@/presentation/navigation";
import { createFamilyFeedComposition } from "@/composition/family";
import { createPostComposition } from "@/composition/post";
import { presentPostDetail } from "@/presentation/post";

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
   const detail = await getPostDetail(
     createPostComposition(),
     postId,
     { personId: session.user.personId, role: session.user.role },
   );

   if (!detail) {
     notFound();
   }
   const viewModel = presentPostDetail(detail);

  if (session.user.role === "parent") {
    const familyContext = await getFamilyFeedContext(
      createFamilyFeedComposition(),
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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <StaffSidebar navigation={staffNavigationConfig} />
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
