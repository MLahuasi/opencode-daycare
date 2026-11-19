const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

/**
 * Normalizes an optional international phone number.
 *
 * @param value - User-provided phone number.
 * @returns The normalized phone number, `null` for empty input or invalid input.
 */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/[\s().-]/g, "");
  return PHONE_PATTERN.test(normalized) ? normalized : null;
}
