/** Stored credential record associated with a person. */
export type Credential = {
  id: string;
  personId: string;
  passwordHash: string;
};