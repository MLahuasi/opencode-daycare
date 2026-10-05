import { redirect } from "next/navigation";
import { requireActiveSession } from "@/auth";
import { updateFeedCommentAction } from "@/app/features/feed/server";
import { getPostDetail } from "@/src/application/post";
import { createPostComposition } from "@/src/composition/post";
import { FamilyCommentForm } from "@/src/presentation/post";

/** Dynamic parameters accepted by the Post comment edit route. */
type EditPostCommentPageProps = {
  /** Promise containing the parent Post and comment identifiers. */
  params: Promise<{ postId: string; commentId: string }>;
};

/**
 * Renders the authorized edit form for a person's own Post comment.
 *
 * @param props - Dynamic comment route parameters.
 * @param props.params - Promise containing the Post and comment identifiers.
 * @returns The comment edit form or a redirect when unavailable.
 */
export default async function EditPostCommentPage({
  params,
}: EditPostCommentPageProps) {
  const session = await requireActiveSession();
  const { commentId, postId } = await params;
   const dependencies = createPostComposition();
   const comment = await dependencies.comments.findById(commentId);

  if (
    !comment ||
    comment.authorId !== session.user.personId ||
    comment.postId !== postId
  ) {
    redirect("/family-feed");
  }

   const detail = await getPostDetail(
     dependencies,
     postId,
     { personId: session.user.personId, role: session.user.role },
   );
  if (!detail) {
    redirect("/family-feed");
  }

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <FamilyCommentForm
        action={updateFeedCommentAction}
        cancelHref={`/posts/${encodeURIComponent(postId)}`}
        commentId={comment.id}
        heading="Editar comentario"
        initialBody={comment.body}
        postId={postId}
        postLabel={detail.recipient.label}
        submitLabel="Guardar cambios"
      />
    </main>
  );
}
