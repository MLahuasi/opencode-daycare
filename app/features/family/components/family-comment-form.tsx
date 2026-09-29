"use client";

import { useActionState, useState } from "react";
import type { SubmitEvent } from "react";
import { Button, FormField, LinkButton } from "@/app/components/ui";
import { MAX_FEED_COMMENT_BODY_LENGTH } from "@/app/features/feed";
import {
  type FeedCommentAction,
  type FeedCommentActionState,
} from "../actions";
import styles from "./family-comment-form.module.css";

const INITIAL_ACTION_STATE: FeedCommentActionState = {
  errors: {},
  message: "",
};

type FamilyCommentFormProps = {
  action: FeedCommentAction;
  cancelHref: string;
  className?: string;
  commentId?: string;
  initialBody?: string;
  heading?: string;
  postId: string;
  postLabel: string;
  submitLabel?: string;
};

/**
 * Renders the family form used to create a comment on an authorized post.
 *
 * @param props - Comment form configuration and destination information.
 * @param props.action - Server Action used to persist the comment.
 * @param props.cancelHref - Destination used by the cancel action.
 * @param props.className - Optional classes applied to the form card.
 * @param props.commentId - Optional comment identifier used in edit mode.
 * @param props.initialBody - Existing body used to initialize edit mode.
 * @param props.heading - Heading displayed above the form.
 * @param props.postId - Stable post identifier submitted with the form.
 * @param props.postLabel - Post title shown as form context.
 * @param props.submitLabel - Label displayed on the submit button.
 * @returns A responsive comment creation form.
 */
export function FamilyCommentForm({
  action,
  cancelHref,
  className = "",
  commentId,
  initialBody = "",
  heading = "Nuevo comentario",
  postId,
  postLabel,
  submitLabel = "Guardar",
}: FamilyCommentFormProps) {
  const [actionState, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );
  const [body, setBody] = useState(initialBody);
  const [localError, setLocalError] = useState("");
  const serverError = actionState.message || actionState.errors.body || "";
  const error = localError || serverError;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    const normalizedBody = body.trim();

    if (!normalizedBody) {
      event.preventDefault();
      setLocalError("Escribe un comentario.");
      return;
    }

    if (normalizedBody.length > MAX_FEED_COMMENT_BODY_LENGTH) {
      event.preventDefault();
      setLocalError(
        `El comentario no puede superar los ${MAX_FEED_COMMENT_BODY_LENGTH} caracteres.`,
      );
      return;
    }

    setLocalError("");
  }

  return (
    <form
      action={formAction}
      className={`${styles.form} ${className}`}
      noValidate
      onSubmit={handleSubmit}
    >
      <header className={styles.header}>
        <LinkButton className={styles.cancel} href={cancelHref} variant="ghost">
          Cancelar
        </LinkButton>
        <h1>{heading}</h1>
        <Button
          aria-busy={pending}
          className={styles.submit}
          disabled={pending}
          type="submit"
          variant="ghost"
        >
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </header>

      <div className={styles.content}>
        <input name="postId" type="hidden" value={postId} />
        {commentId ? <input name="commentId" type="hidden" value={commentId} /> : null}
        <p className={styles.context}>Comentando en: {postLabel}</p>
        <FormField className={styles.field} label="Comentario">
          <textarea
            aria-describedby={error ? "comment-form-error" : "comment-body-count"}
            aria-invalid={Boolean(error)}
            maxLength={MAX_FEED_COMMENT_BODY_LENGTH}
            name="body"
            onChange={(event) => setBody(event.target.value)}
            placeholder="Escribí un comentario…"
            rows={6}
            value={body}
          />
          <small id="comment-body-count">
            {body.length}/{MAX_FEED_COMMENT_BODY_LENGTH}
          </small>
        </FormField>

        {error ? (
          <p className={styles.error} id="comment-form-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
