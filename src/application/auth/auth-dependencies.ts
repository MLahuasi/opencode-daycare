import type { Credential } from "@/src/domain/auth";
import type { CreateCredentialInput } from "./dto/credential";

/** Provider capabilities required by Auth application use cases. */
export type AuthDependencies = {
  credentials: {
    upsert(credential: Credential): Promise<void>;
  };
  passwordHasher: {
    hash(password: string): Promise<string>;
  };
  createId(): string;
};

/** Creates a credential through the password hashing port. */
export type CreateCredential = (
  input: CreateCredentialInput,
) => Promise<Credential>;
