/**
 * Password policy for account activation.
 *
 * The accepted symbol set is intentionally explicit so the policy remains
 * stable and predictable for users and future validation surfaces.
 */
export const ACTIVATION_PASSWORD_PATTERN =
  /^(?=.{8,}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/;

/**
 * Checks whether a password meets the account activation policy.
 *
 * @param password Password value to validate.
 * @returns True when the password meets every activation requirement.
 */
export function isValidActivationPassword(password: string): boolean {
  return ACTIVATION_PASSWORD_PATTERN.test(password);
}
