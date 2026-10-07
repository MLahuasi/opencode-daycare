import type {
  FeedCommentFormErrors,
  PostFormErrors,
  PostFormValidationResult,
} from "./schemas";

/** Serializable feedback returned by Post create and edit actions. */
export type PostFormActionState = {
  errors: PostFormErrors;
  message: string;
  /** Kids whose active family relationships restrict photo sharing. */
  restrictedKids?: readonly { id: string; name: string }[];
  /** Short-lived server confirmation required to exclude restricted kids. */
  restrictionConfirmation?: string;
  /** Destination used after a successful mutation. */
  redirectTo?: string;
};

/** Server Action contract consumed by the shared Post form. */
export type PostFormAction = (
  previousState: PostFormActionState,
  formData: FormData,
) => Promise<PostFormActionState>;

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

/** Re-exported validation result used by Presentation adapters. */
export type PostFormResult = PostFormValidationResult;
