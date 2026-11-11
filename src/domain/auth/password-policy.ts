/** Maximum password length accepted by bcrypt, measured as UTF-8 bytes. */
export const MAX_PASSWORD_UTF8_BYTES = 72;

/**
 * Normalizes a password without trimming or otherwise changing its content.
 *
 * NFC keeps canonically equivalent Unicode representations consistent while
 * preserving intentional whitespace in the password.
 *
 * @param password - Password submitted by the user.
 * @returns The NFC-normalized password.
 */
export function normalizePassword(password: string): string {
  return password.normalize("NFC");
}

/**
 * Checks the UTF-8 byte length of a password after normalization.
 *
 * @param password - Password submitted by the user.
 * @returns Whether the normalized password fits within bcrypt's byte limit.
 */
export function isPasswordWithinUtf8Limit(password: string): boolean {
  return (
    new TextEncoder().encode(normalizePassword(password)).byteLength <=
    MAX_PASSWORD_UTF8_BYTES
  );
}
