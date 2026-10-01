import { getTodayIsoDate } from "@/src/utils";
import type { Room } from "@/src/domain/room";
import type {
  KidFieldValidationResult,
  KidFormErrors,
  KidFormInput,
  KidFormValidationResult,
} from "../dto/kid-form";
import { parseCommaSeparatedTags } from "../utils";

const DISPLAY_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MAX_NAME_LENGTH = 120;

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= daysInMonth[month - 1];
}

function validateKidName(value: unknown): KidFieldValidationResult {
  if (typeof value !== "string") {
    return { value: "", error: "Ingresa el nombre completo." };
  }

  const normalizedName = value.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
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

function validateKidBirthDate(
  value: unknown,
  todayIsoDate = getTodayIsoDate(),
): KidFieldValidationResult {
  if (typeof value !== "string" || !value.trim()) {
    return { value: "", error: "Ingresa la fecha de nacimiento." };
  }

  const displayDate = value.trim();
  const match = DISPLAY_DATE_PATTERN.exec(displayDate);

  if (!match) {
    return { value: displayDate, error: "Usa el formato dd/mm/aaaa." };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) {
    return { value: displayDate, error: "Ingresa una fecha válida." };
  }

  const isoDate = `${match[3]}-${match[2]}-${match[1]}`;

  if (isoDate > todayIsoDate) {
    return {
      value: displayDate,
      error: "La fecha de nacimiento no puede ser futura.",
    };
  }

  return { value: isoDate };
}

function validateKidRoomId(
  value: unknown,
  rooms: readonly Room[],
): KidFieldValidationResult {
  if (typeof value !== "string" || !value.trim()) {
    return { value: "", error: "Selecciona una sala." };
  }

  const roomId = value.trim();

  if (!rooms.some((room) => room.id === roomId)) {
    return { value: roomId, error: "Selecciona una sala válida." };
  }

  return { value: roomId };
}

function validateKidAllergies(value: unknown): KidFieldValidationResult {
  if (value === undefined || value === null || value === "") {
    return { value: "" };
  }

  if (typeof value !== "string") {
    return { value: "", error: "Las alergias deben ser texto." };
  }

  return { value: parseCommaSeparatedTags(value).join(", ") };
}

function validateKidMedicalNotes(value: unknown): KidFieldValidationResult {
  if (value === undefined || value === null || value === "") {
    return { value: "" };
  }

  if (typeof value !== "string") {
    return { value: "", error: "Las notas médicas deben ser texto." };
  }

  return { value: value.trim() };
}

/**
 * Validates and normalizes all editable kid form values.
 *
 * @param input - Raw values collected from the Add or Edit form.
 * @param rooms - Available rooms accepted by the form.
 * @param todayIsoDate - Current local date used to reject future birth dates.
 * @returns Validated persistence values or field-level errors.
 */
export function validateKidForm(
  input: KidFormInput,
  rooms: readonly Room[],
  todayIsoDate = getTodayIsoDate(),
): KidFormValidationResult {
  const name = validateKidName(input.name);
  const birthDate = validateKidBirthDate(input.birthDate, todayIsoDate);
  const roomId = validateKidRoomId(input.roomId, rooms);
  const allergies = validateKidAllergies(input.allergies);
  const medicalNotes = validateKidMedicalNotes(input.medicalNotes);
  const errors: KidFormErrors = {};

  if (name.error) errors.name = name.error;
  if (birthDate.error) errors.birthDate = birthDate.error;
  if (roomId.error) errors.roomId = roomId.error;
  if (allergies.error) errors.allergies = allergies.error;
  if (medicalNotes.error) errors.medicalNotes = medicalNotes.error;

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: name.value,
      birthDate: birthDate.value,
      roomId: roomId.value,
      allergies: allergies.value,
      medicalNotes: medicalNotes.value,
    },
  };
}
