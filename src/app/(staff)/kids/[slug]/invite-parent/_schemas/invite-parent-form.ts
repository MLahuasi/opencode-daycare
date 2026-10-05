import type { ParentRelationship } from "@/domain/family";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 120;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PARENT_RELATIONSHIPS: readonly ParentRelationship[] = ["mother", "father", "guardian"];

/** Values accepted by the parent invitation form. */
export type InviteParentFormValues = {
  /** Parent display name. */
  name: string;
  /** Parent email address. */
  email: string;
  /** Parent relationship with the kid. */
  relationship: ParentRelationship;
};

/** Field-level validation errors returned by the parent invitation form. */
export type InviteParentFormErrors = Partial<Record<keyof InviteParentFormValues, string>>;

type InviteParentFormInput = Partial<Record<keyof InviteParentFormValues, unknown>>;

type InviteParentFormValidationResult =
  | { success: true; data: InviteParentFormValues }
  | { success: false; errors: InviteParentFormErrors };

/**
 * Validates and normalizes the parent invitation form values.
 *
 * @param input - Raw values collected from the invitation form.
 * @returns Validated form values or field-level errors.
 */
export function validateInviteParentForm(
  input: InviteParentFormInput,
): InviteParentFormValidationResult {
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const relationship = input.relationship as ParentRelationship;
  const errors: InviteParentFormErrors = {};

  if (name.length < MIN_NAME_LENGTH || name.split(" ").length < 2) {
    errors.name = "Ingresa al menos un nombre y un apellido.";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = "El nombre no puede superar los 120 caracteres.";
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.email = "Ingresa un email válido.";
  }

  if (!PARENT_RELATIONSHIPS.includes(relationship)) {
    errors.relationship = "Selecciona un parentesco.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { name, email, relationship } };
}
