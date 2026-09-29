import type { FeedCommentFormErrors } from "@/app/features/feed";

/** Serializable feedback returned by comment actions. */
export type FeedCommentActionState = {
  errors: FeedCommentFormErrors;
  message: string;
};

/** Server Action contract consumed by the comment form. */
export type FeedCommentAction = (
  previousState: FeedCommentActionState,
  formData: FormData,
) => Promise<FeedCommentActionState>;
