import type { PostFormErrors } from "../schemas";

/** Serializable feedback returned by post create and edit actions. */
export type PostFormActionState = {
  errors: PostFormErrors;
  message: string;
};

/** Server Action contract consumed by the shared post form. */
export type PostFormAction = (
  previousState: PostFormActionState,
  formData: FormData,
) => Promise<PostFormActionState>;
