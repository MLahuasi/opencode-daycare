import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { createFeedCommentAction } from "@/app/features/family/server";
import { getPostDetail } from "@/app/features/post-detail/server";
import { FamilyCommentForm } from "@/src/components/domain/post";

/** Dynamic parameters accepted by the new Post comment route. */
type NewPostCommentPageProps = {
  /** Promise containing the parent Post identifier. */
  params: Promise<{ postId: string }>;
};

/**
 * Renders the authorized comment creation form for a Post.
 *
 * @param props - Dynamic comment route parameters.
 * @param props.params - Promise containing the parent Post identifier.
 * @returns The comment creation form or a redirect when the Post is unavailable.
 */
export default async function NewPostCommentPage({
  params,
}: NewPostCommentPageProps) {
  await requireActiveSession();
  const { postId } = await params;
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
