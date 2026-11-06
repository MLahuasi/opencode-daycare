import { redirect } from "next/navigation";
import { requireActiveSession } from "@/composition/auth";
import { updateFeedCommentAction } from "@/app/_actions/posts";
import { getPostDetail } from "@/application/post";
import { createPostComposition, getPostViewer } from "@/composition/post";
import { FamilyCommentForm } from "@/presentation/post";
import { presentPostDetail } from "@/presentation/post";
import { getApplicationEnvironment } from "@/config/server";

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
   const dependencies = createPostComposition(session.user.daycareId);
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
      await getPostViewer(session.user.daycareId, session.user.personId),
   );
   if (!detail) {
     redirect("/family-feed");
   }
   const environment = getApplicationEnvironment();
   const viewModel = presentPostDetail(detail, environment.locale, environment.timeZone);

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <FamilyCommentForm
        action={updateFeedCommentAction}
        cancelHref={`/posts/${encodeURIComponent(postId)}`}
        commentId={comment.id}
        heading="Editar comentario"
        initialBody={comment.body}
        postId={postId}
         postLabel={viewModel.recipient.label}
        submitLabel="Guardar cambios"
      />
    </main>
  );
}
