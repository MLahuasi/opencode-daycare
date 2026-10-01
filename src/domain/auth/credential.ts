/** Persisted password credential associated with a person. */
export type Credential = {
  /** Stable credential identifier. */
  id: string;
  /** Stable identifier of the person who owns the credential. */
  personId: string;
  /** Password hash produced by the configured hasher. */
  passwordHash: string;
};

/** Password policy used when a parent activates an account. */
export const ACTIVATION_PASSWORD_PATTERN =
  /^(?=.{8,}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/;

/**
 * Checks whether a password satisfies the account activation policy.
 *
 * @param password - Plaintext password to validate.
 * @returns Whether the password satisfies all activation requirements.
 */
export function isValidActivationPassword(password: string): boolean {
  return ACTIVATION_PASSWORD_PATTERN.test(password);
}
