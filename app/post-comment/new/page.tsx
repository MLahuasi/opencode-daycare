import { redirect } from "next/navigation";
import { FamilyCommentForm } from "@/app/features/family";
import { createFeedCommentAction } from "@/app/features/family/server";
import { getPostDetail } from "@/app/features/post-detail/server";
import { requireActiveSession } from "@/auth";

function getQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Renders the authorized parent or staff comment creation form for a post.
 *
 * @param props - Route search parameters containing the post identifier.
 * @param props.searchParams - Promise with the `postId` query parameter.
 * @returns The comment creation form for the authorized post.
 */
export default async function NewPostCommentPage({
  searchParams,
}: {
  searchParams?: Promise<{ postId?: string | string[] }>;
}) {
  await requireActiveSession();

  const postId = getQueryValue((await searchParams)?.postId);
  if (!postId) {
    redirect("/family-feed");
  }

  const detail = await getPostDetail(postId);
  if (!detail) {
    redirect("/family-feed");
  }

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <FamilyCommentForm
        action={createFeedCommentAction}
        cancelHref={`/posts/${encodeURIComponent(postId)}`}
        postId={postId}
        postLabel={detail.recipient.label}
      />
    </main>
  );
}
