import {
  isValidActivationPassword,
  type Credential,
} from "@/src/domain/auth";
import type { AuthDependencies } from "../auth-dependencies";
import type { CreateCredentialInput } from "../dto/credential";

/** Error raised when a password does not satisfy activation policy. */
export class InvalidActivationPasswordError extends Error {}

/** Creates and persists a hashed credential for an activated person. */
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
