/** Serializable feedback returned by the parent invitation acceptance action. */
export type ParentInvitationActionState = {
  /** Field-level validation errors. */
  errors: {
    /** Email validation error. */
    email?: string;
    /** Password validation error. */
    password?: string;
    /** Password confirmation validation error. */
    passwordConfirmation?: string;
    /** Consent validation error. */
    photoSharingConsent?: string;
  };
  /** General action feedback message. */
  message: string;
};
