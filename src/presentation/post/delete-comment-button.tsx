"use client";

import { useActionState } from "react";
import type { SubmitEvent } from "react";
import { Button } from "@/src/presentation/ui";
import type {
  FeedCommentAction,
  FeedCommentActionState,
} from "@/src/presentation/post/contracts";

const INITIAL_ACTION_STATE: FeedCommentActionState = {
  errors: {},
  message: "",
};

type DeleteCommentButtonProps = {
  action: FeedCommentAction;
  className?: string;
  commentId: string;
  postId: string;
};

/**
 * Renders an owner-only comment deletion control with explicit confirmation.
 *
 * @param props - Action and identifiers used by the deletion form.
 * @param props.action - Server Action used to delete the comment.
 * @param props.className - Optional classes applied to the form.
 * @param props.commentId - Stable identifier of the comment to delete.
 * @param props.postId - Stable identifier of the comment's post.
 * @returns A confirmation-backed deletion form.
 */
export function DeleteCommentButton({
  action,
  className = "",
  commentId,
  postId,
}: DeleteCommentButtonProps) {
  const [actionState, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    if (!window.confirm("¿Quieres eliminar este comentario?")) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className={className} onSubmit={handleSubmit}>
      <input name="commentId" type="hidden" value={commentId} />
      <input name="postId" type="hidden" value={postId} />
      <Button
        aria-busy={pending}
        disabled={pending}
        type="submit"
        variant="ghost"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </Button>
      {actionState.message ? (
        <p role="alert">{actionState.message}</p>
      ) : null}
    </form>
  );
}
