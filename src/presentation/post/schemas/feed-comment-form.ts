/** Maximum number of characters accepted in a feed comment. */
export const MAX_FEED_COMMENT_BODY_LENGTH = 500;

/** Raw values accepted by the feed comment validator. */
export type FeedCommentFormInput = {
  body?: unknown;
};

/** Field-level validation errors returned by the feed comment validator. */
export type FeedCommentFormErrors = Partial<Record<"body", string>>;

/** Normalized values returned after validating a feed comment. */
export type FeedCommentFormValues = {
  body: string;
};

/** Result returned after validating feed comment values. */
export type FeedCommentFormValidationResult =
  | { success: true; data: FeedCommentFormValues }
  | { success: false; errors: FeedCommentFormErrors };

/**
 * Validates and normalizes a feed comment payload.
 *
 * @param input - Raw values collected from a comment form or server action.
 * @returns Normalized comment values or field-level errors.
 */
export function validateFeedCommentForm(
  input: FeedCommentFormInput,
): FeedCommentFormValidationResult {
  const body = typeof input.body === "string" ? input.body.trim() : "";

  if (!body) {
    return {
      success: false,
      errors: { body: "Escribe un comentario." },
    };
  }

  if (body.length > MAX_FEED_COMMENT_BODY_LENGTH) {
    return {
      success: false,
      errors: {
        body: `El comentario no puede superar los ${MAX_FEED_COMMENT_BODY_LENGTH} caracteres.`,
      },
    };
  }

  return { success: true, data: { body } };
}
