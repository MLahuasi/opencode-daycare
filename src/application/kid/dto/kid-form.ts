import type { Kid } from "@/src/domain/kid";

/** Editable kid values shared by the Add and Edit flows. */
export type KidFormValues = Pick<
  Kid,
  "allergies" | "birthDate" | "medicalNotes" | "name" | "roomId"
>;

/** Field-level validation errors returned by the kid form validator. */
export type KidFormErrors = Partial<Record<keyof KidFormValues, string>>;

/** Raw input accepted by the kid form validator. */
export type KidFormInput = Partial<Record<keyof KidFormValues, unknown>>;

/** Result returned by validation of a single form field. */
export type KidFieldValidationResult = {
  value: string;
  error?: string;
};

/** Result returned after validating and normalizing kid form input. */
export type KidFormValidationResult =
  | { success: true; data: KidFormValues }
  | { success: false; errors: KidFormErrors };
