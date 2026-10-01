import type { Credential } from "@/src/domain/auth";

/** Values required to create a stored credential. */
export type CreateCredentialInput = {
  /** Stable person identifier receiving the credential. */
  personId: string;
  /** Plaintext password to validate and hash. */
  password: string;
};

/** Credential creation result with the password excluded. */
export type CreatedCredential = Credential;
