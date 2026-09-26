import { StaffSidebar } from "@/app/components/layout";
import { FamilySidebar } from "@/app/features/family";
import { getAuthenticatedFamilyContext } from "@/app/features/family/server";
import { PostDetailView } from "@/app/features/post-detail";
import { getPostDetail } from "@/app/features/post-detail/server";
import { staffNavigationConfig } from "@/app/shared/config";
import { requireActiveSession } from "@/auth";
import { notFound } from "next/navigation";

function getQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Renders an authorized read-only post detail for staff or family accounts.
 *
 * @param props - Route search parameters containing the post identifier.
 * @param props.searchParams - Promise with the `id` query parameter.
 * @returns The role-specific application shell and post detail.
 */
export default async function PostDetailPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string | string[] }>;
}) {
  const session = await requireActiveSession();
  const postId = getQueryValue((await searchParams)?.id);

  if (!postId) {
    notFound();
  }

  const detail = await getPostDetail(postId);

  if (!detail) {
    notFound();
  }

  if (session.user.role === "parent") {
    const familyContext = await getAuthenticatedFamilyContext();

    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <FamilySidebar person={familyContext.person} />
        <PostDetailView backHref="/family-feed" detail={detail} className="min-w-0 flex-1" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <StaffSidebar navigation={staffNavigationConfig} />
      <PostDetailView backHref="/home" detail={detail} className="min-w-0 flex-1" />
    </div>
  );
}
