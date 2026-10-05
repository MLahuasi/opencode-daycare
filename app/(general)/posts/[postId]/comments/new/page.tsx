import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { createFeedCommentAction } from "@/app/features/feed/server";
import { getPostDetail } from "@/src/application/post";
import { createPostComposition } from "@/src/composition/post";
import { FamilyCommentForm } from "@/src/presentation/post";
import { presentPostDetail } from "@/src/presentation/post";

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
  const { postId } = await params;
  const session = await requireActiveSession();
  const detail = await getPostDetail(
    createPostComposition(),
    postId,
    { personId: session.user.personId, role: session.user.role },
  );

   if (!detail) {
     redirect("/family-feed");
   }
   const viewModel = presentPostDetail(detail);

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <FamilyCommentForm
        action={createFeedCommentAction}
        cancelHref={`/posts/${encodeURIComponent(postId)}`}
        postId={postId}
         postLabel={viewModel.recipient.label}
      />
    </main>
  );
}
