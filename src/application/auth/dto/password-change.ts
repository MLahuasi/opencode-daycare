/** Values required to replace an existing password credential. */
export type ChangePasswordInput = {
  /** Daycare tenant that owns the credential. */
  daycareId: string;
  /** Stable person identifier that owns the credential. */
  personId: string;
  /** Replacement plaintext password to validate and hash. */
  password: string;
};
