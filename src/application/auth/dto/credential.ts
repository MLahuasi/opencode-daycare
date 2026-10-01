import type { Credential } from "@/src/domain/auth";

/** Values required to create a stored credential. */
export type CreateCredentialInput = {
  personId: string;
  password: string;
};

/** Credential creation result with the password excluded. */
export type CreatedCredential = Credential;
