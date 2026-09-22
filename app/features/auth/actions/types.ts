import type { LinkParentFormErrors } from "../schemas";

/** Serializable feedback returned by the parent-link Server Action. */
export type LinkParentActionState = {
  errors: LinkParentFormErrors;
  message: string;
};

/** Server Action contract consumed by the parent-link form. */
export type LinkParentAction = (
  previousState: LinkParentActionState,
  formData: FormData,
) => Promise<LinkParentActionState>;
