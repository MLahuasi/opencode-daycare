import type { KidFormErrors } from "../schemas";

/** Serializable feedback returned by Add and Edit Server Actions. */
export type KidFormActionState = {
  errors: KidFormErrors;
  message: string;
};

/** Server Action contract consumed by the shared kid form. */
export type KidFormAction = (
  previousState: KidFormActionState,
  formData: FormData,
) => Promise<KidFormActionState>;
