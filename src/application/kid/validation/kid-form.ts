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
    return { value: "", error: "nameRequired" };
  }

  const normalizedName = value.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
    return { value: normalizedName, error: "nameRequired" };
  }

  if (normalizedName.length > MAX_NAME_LENGTH) {
    return {
      value: normalizedName,
      error: "nameTooLong",
    };
  }

  if (normalizedName.split(" ").length < 2) {
    return {
      value: normalizedName,
      error: "nameMissingLastName",
    };
  }

  return { value: normalizedName };
}

function validateKidBirthDate(
  value: unknown,
  todayIsoDate = getTodayIsoDate(),
): KidFieldValidationResult {
  if (typeof value !== "string" || !value.trim()) {
    return { value: "", error: "birthDateRequired" };
  }

  const displayDate = value.trim();
  const match = DISPLAY_DATE_PATTERN.exec(displayDate);

  if (!match) {
    return { value: displayDate, error: "birthDateUnexpectedFormat" };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) {
    return { value: displayDate, error: "birthDateInvalid" };
  }

  const isoDate = `${match[3]}-${match[2]}-${match[1]}`;

  if (isoDate > todayIsoDate) {
    return {
      value: displayDate,
      error: "birthDateFuture",
    };
  }

  return { value: isoDate };
}

function validateKidRoomId(
  value: unknown,
  rooms: readonly Room[],
): KidFieldValidationResult {
  if (typeof value !== "string" || !value.trim()) {
    return { value: "", error: "roomRequired" };
  }

  const roomId = value.trim();

  if (!rooms.some((room) => room.id === roomId)) {
    return { value: roomId, error: "roomInvalid" };
  }

  return { value: roomId };
}

function validateKidAllergies(value: unknown): KidFieldValidationResult {
  if (value === undefined || value === null || value === "") {
    return { value: "" };
  }

  if (typeof value !== "string") {
    return { value: "", error: "allergiesUnexpectedType" };
  }

  return { value: parseCommaSeparatedTags(value).join(", ") };
}

function validateKidMedicalNotes(value: unknown): KidFieldValidationResult {
  if (value === undefined || value === null || value === "") {
    return { value: "" };
  }

  if (typeof value !== "string") {
    return { value: "", error: "medicalNotesUnexpectedType" };
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
