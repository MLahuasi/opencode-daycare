import type { Kid } from "@/domain/kid";

/** Editable kid values shared by the Add and Edit flows. */
export type KidFormValues = Pick<
  Kid,
  "allergies" | "birthDate" | "medicalNotes" | "name" | "roomId"
>;

/** Stable reasons that a kid field can fail validation. */
export type KidFormErrorCode =
  | "birthDateFuture"
  | "birthDateInvalid"
  | "birthDateRequired"
  | "birthDateUnexpectedFormat"
  | "medicalNotesUnexpectedType"
  | "nameMissingLastName"
  | "nameRequired"
  | "nameTooLong"
  | "roomInvalid"
  | "roomRequired"
  | "allergiesUnexpectedType";

/** Field-level validation reasons returned by the kid form validator. */
export type KidFormErrors = Partial<
  Record<keyof KidFormValues, KidFormErrorCode>
>;

/** Raw input accepted by the kid form validator. */
export type KidFormInput = Partial<Record<keyof KidFormValues, unknown>>;

/** Result returned by validation of a single form field. */
export type KidFieldValidationResult = {
  value: string;
  error?: KidFormErrorCode;
};

/** Result returned after validating and normalizing kid form input. */
export type KidFormValidationResult =
  | { success: true; data: KidFormValues }
  | { success: false; errors: KidFormErrors };
