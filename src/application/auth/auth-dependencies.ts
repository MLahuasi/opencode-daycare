import type { CreateCredentialInput } from "./dto/credential";
import type { Credential } from "@/domain/auth";
import type {
  AuthIdentifierGenerator,
  CredentialRepository,
  PasswordHasher,
} from "./ports";

/** Provider capabilities required by Auth application use cases. */
export type AuthDependencies = {
  /** Credential persistence port. */
  credentials: CredentialRepository;
  /** Password hashing and comparison port. */
  passwordHasher: PasswordHasher;
  /** Identifier generation port. */
  identifiers: AuthIdentifierGenerator;
};

/** Function contract for creating a credential through the password hashing port. */
export type CreateCredential = (
  input: CreateCredentialInput,
) => Promise<Credential>;
