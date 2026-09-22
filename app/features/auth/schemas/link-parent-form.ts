import type { ParentRelationship } from "@/app/features/family";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 120;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PARENT_RELATIONSHIPS: readonly ParentRelationship[] = [
  "mother",
  "father",
  "guardian",
];

/** Values accepted by the parent-link invitation form. */
export type LinkParentFormValues = {
  name: string;
  email: string;
  relationship: ParentRelationship;
};

/** Field-level validation errors returned by the parent-link form validator. */
export type LinkParentFormErrors = Partial<
  Record<keyof LinkParentFormValues, string>
>;

type LinkParentFormInput = Partial<
  Record<keyof LinkParentFormValues, unknown>
>;

type LinkParentFormValidationResult =
  | { success: true; data: LinkParentFormValues }
  | { success: false; errors: LinkParentFormErrors };

function validateName(value: unknown): { value: string; error?: string } {
  if (typeof value !== "string") {
    return { value: "", error: "Ingresa el nombre completo." };
  }

  const normalizedName = value.trim().replace(/\s+/g, " ");

  if (normalizedName.length < MIN_NAME_LENGTH) {
    return { value: normalizedName, error: "Ingresa el nombre completo." };
  }

  if (normalizedName.length > MAX_NAME_LENGTH) {
    return {
      value: normalizedName,
      error: "El nombre no puede superar los 120 caracteres.",
    };
  }

  if (normalizedName.split(" ").length < 2) {
    return {
      value: normalizedName,
      error: "Ingresa al menos un nombre y un apellido.",
    };
  }

  return { value: normalizedName };
}

function validateEmail(value: unknown): { value: string; error?: string } {
  if (typeof value !== "string") {
    return { value: "", error: "Ingresa un email válido." };
  }

  const normalizedEmail = value.trim().toLowerCase();

  if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
    return { value: normalizedEmail, error: "Ingresa un email válido." };
  }

  return { value: normalizedEmail };
}

function validateRelationship(
  value: unknown,
): { value?: ParentRelationship; error?: string } {
  if (
    typeof value !== "string" ||
    !PARENT_RELATIONSHIPS.includes(value as ParentRelationship)
  ) {
    return { error: "Selecciona un parentesco." };
  }

  return { value: value as ParentRelationship };
}

/**
 * Validates and normalizes the parent-link invitation form values.
 *
 * @param input - Raw values collected from the invitation form.
 * @returns Validated form values or field-level errors.
 */
export function validateLinkParentForm(
  input: LinkParentFormInput,
): LinkParentFormValidationResult {
  const name = validateName(input.name);
  const email = validateEmail(input.email);
  const relationship = validateRelationship(input.relationship);
  const errors: LinkParentFormErrors = {};

  if (name.error) errors.name = name.error;
  if (email.error) errors.email = email.error;
  if (relationship.error) errors.relationship = relationship.error;

  if (Object.keys(errors).length > 0 || !relationship.value) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: name.value,
      email: email.value,
      relationship: relationship.value,
    },
  };
}
