import { notFound } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { getAuthenticatedFamilyContext } from "@/app/features/family/server";
import { PostDetailView } from "@/app/features/post-detail";
import { getPostDetail } from "@/app/features/post-detail/server";
import { FamilySidebar, StaffSidebar } from "@/src/components/layout";
import { staffNavigationConfig } from "@/src/config";

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
  const detail = await getPostDetail(postId);

  if (!detail) {
    notFound();
  }

  if (session.user.role === "parent") {
    const familyContext = await getAuthenticatedFamilyContext();

    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <FamilySidebar person={familyContext.person} />
        <PostDetailView
          backHref="/family-feed"
          className="min-w-0 flex-1"
          detail={detail}
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
        detail={detail}
        viewerPersonId={session.user.personId}
      />
    </div>
  );
}
