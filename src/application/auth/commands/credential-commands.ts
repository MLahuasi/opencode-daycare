import {
  isValidActivationPassword,
  type Credential,
} from "@/src/domain/auth";
import type { AuthDependencies } from "../auth-dependencies";
import type { CreateCredentialInput } from "../dto/credential";

/** Error raised when a password does not satisfy activation policy. */
export class InvalidActivationPasswordError extends Error {}

/**
 * Creates and persists a hashed credential for an activated person.
 *
 * @param dependencies - Credential persistence and password hashing ports.
 * @param input - Person and plaintext password used to create the credential.
 * @param input.personId - Stable person identifier.
 * @param input.password - Plaintext password to validate and hash.
 * @returns The persisted credential containing only the password hash.
 * @throws InvalidActivationPasswordError when the password fails policy.
 */
export async function createCredential(
  dependencies: AuthDependencies,
  input: CreateCredentialInput,
): Promise<Credential> {
  if (!isValidActivationPassword(input.password)) {
    throw new InvalidActivationPasswordError("The password does not meet activation policy.");
  }

  const credential: Credential = {
    id: dependencies.createId(),
    personId: input.personId,
    passwordHash: await dependencies.passwordHasher.hash(input.password),
  };

  await dependencies.credentials.upsert(credential);

  return credential;
}
