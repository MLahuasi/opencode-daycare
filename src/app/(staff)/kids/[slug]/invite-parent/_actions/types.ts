import type { InviteParentFormErrors } from "../_schemas";

/** Serializable feedback returned by the invite-parent Server Action. */
export type InviteParentActionState = {
  /** Field-level validation errors. */
  errors: InviteParentFormErrors;
  /** General action feedback message. */
  message: string;
};
