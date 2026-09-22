/** Invitation sent to a person to activate their account. */
export type Invitation = {
  id: string;
  personId: string;
  code: string;
  expiresAt: Date;
  acceptedAt: Date | null;
};