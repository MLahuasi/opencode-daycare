import { redirect } from "next/navigation";
import { FamilyCommentForm } from "@/app/features/family";
import { updateFeedCommentAction } from "@/app/features/family/server";
import { getFeedCommentById } from "@/app/features/feed/server";
import { getPostDetail } from "@/app/features/post-detail/server";
import { requireActiveSession } from "@/auth";

function getQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Renders the authorized edit form for a parent's own comment.
 *
 * @param props - Route search parameters containing the comment identifier.
 * @param props.searchParams - Promise with the `id` query parameter.
 * @returns The comment edit form for the authorized comment.
 */
export default async function EditPostCommentPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string | string[] }>;
}) {
  const session = await requireActiveSession();

  const commentId = getQueryValue((await searchParams)?.id);
  if (!commentId) {
    redirect("/family-feed");
  }

  const comment = await getFeedCommentById(commentId);
  if (!comment || comment.authorId !== session.user.personId) {
    redirect("/family-feed");
  }

  const detail = await getPostDetail(comment.postId);
  if (!detail) {
    redirect("/family-feed");
  }

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <FamilyCommentForm
        action={updateFeedCommentAction}
        cancelHref={`/post-detail?id=${encodeURIComponent(comment.postId)}`}
        commentId={comment.id}
        heading="Editar comentario"
        initialBody={comment.body}
        postId={comment.postId}
        postLabel={detail.recipient.label}
        submitLabel="Guardar cambios"
      />
    </main>
  );
}
