/** Invitation sent to a person to activate their account. */
export type Invitation = {
  id: string;
  personId: string;
  code: string;
  expiresAt: Date;
  acceptedAt: Date | null;
};

/** Stored credential record associated with a person. */
export type Credential = {
  id: string;
  personId: string;
  passwordHash: string;
};
