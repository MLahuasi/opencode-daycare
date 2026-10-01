import type { LinkParentFormErrors } from "@/app/features/auth/schemas";

/** Serializable feedback returned by the invite-parent Server Action. */
export type InviteParentActionState = {
  /** Field-level validation errors. */
  errors: LinkParentFormErrors;
  /** General action feedback message. */
  message: string;
};
