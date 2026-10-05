import type { KidFormErrorCode } from "@/src/application/kid";

const kidFormErrorMessages: Record<KidFormErrorCode, string> = {
  allergiesUnexpectedType: "Las alergias deben ser texto.",
  birthDateFuture: "La fecha de nacimiento no puede ser futura.",
  birthDateInvalid: "Ingresa una fecha válida.",
  birthDateRequired: "Ingresa la fecha de nacimiento.",
  birthDateUnexpectedFormat: "Usa el formato dd/mm/aaaa.",
  medicalNotesUnexpectedType: "Las notas médicas deben ser texto.",
  nameMissingLastName: "Ingresa al menos un nombre y un apellido.",
  nameRequired: "Ingresa el nombre completo.",
  nameTooLong: "El nombre no puede superar los 120 caracteres.",
  roomInvalid: "Selecciona una sala válida.",
  roomRequired: "Selecciona una sala.",
};

/**
 * Converts a neutral kid form validation reason into localized UI copy.
 *
 * @param code - Validation reason returned by the kid application service.
 * @returns The localized error message for the editable field.
 */
export function presentKidFormError(code: KidFormErrorCode | undefined): string | undefined {
  return code ? kidFormErrorMessages[code] : undefined;
}
