const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDate(value: string): [number, number, number] {
  const match = ISO_DATE_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Expected an ISO date-only value, received: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Expected a valid ISO date-only value, received: ${value}`);
  }

  return [year, month, day];
}

/**
 * Normalizes text for case- and accent-insensitive comparisons.
 *
 * @param value Text to normalize.
 * @returns Trimmed lowercase text without combining accent marks.
 */
export function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Creates a stable ASCII slug from a name.
 *
 * @param value Name to convert to a slug.
 * @returns A lowercase hyphen-separated ASCII slug.
 */
export function normalizeSlug(value: string): string {
  return normalizeName(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Checks that every slug in a collection is unique and non-empty.
 *
 * @param slugs Slugs to validate.
 * @returns True when all slugs are unique and contain a value.
 */
export function validateUniqueSlugs(slugs: readonly string[]): boolean {
  const normalizedSlugs = slugs.map((slug) => slug.trim());
  return (
    normalizedSlugs.every(Boolean) &&
    new Set(normalizedSlugs).size === normalizedSlugs.length
  );
}

/**
 * Calculates a person's age using calendar date parts rather than time zones.
 *
 * @param birthDate Birth date in ISO date-only format.
 * @param asOfDate Reference date in ISO date-only format.
 * @returns Age in completed years at the reference date.
 */
export function calculateAge(birthDate: string, asOfDate: string): number {
  const [birthYear, birthMonth, birthDay] = parseIsoDate(birthDate);
  const [asOfYear, asOfMonth, asOfDay] = parseIsoDate(asOfDate);

  if (birthDate > asOfDate) {
    throw new Error("Birth date cannot be after the reference date");
  }

  const birthdayHasPassed =
    asOfMonth > birthMonth ||
    (asOfMonth === birthMonth && asOfDay >= birthDay);

  return asOfYear - birthYear - (birthdayHasPassed ? 0 : 1);
}
