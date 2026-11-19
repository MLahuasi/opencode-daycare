import type { AuthDependencies } from "../auth-dependencies";
import type { ChangePasswordInput } from "../dto/password-change";

/** Error raised when a replacement password is shorter than the account policy. */
export class InvalidChangePasswordError extends Error {}

/** Error raised when the person has no credential that can be replaced. */
export class MissingCredentialError extends Error {}

/**
 * Replaces the password hash of an existing credential without changing its identity.
 *
 * @param dependencies - Credential persistence and password hashing capabilities.
 * @param input - Tenant, person and replacement password derived by the caller.
 * @returns A promise that resolves after the replacement hash is persisted.
 * @throws InvalidChangePasswordError when the password has fewer than eight characters.
 * @throws MissingCredentialError when the person has no existing credential.
 */
export async function changePassword(
  dependencies: AuthDependencies,
  input: ChangePasswordInput,
): Promise<void> {
  if (input.password.length < 8) {
    throw new InvalidChangePasswordError(
      "The password must contain at least eight characters.",
    );
  }

  const credential = await dependencies.credentials.findByPersonId(
    input.daycareId,
    input.personId,
  );

  if (!credential) {
    throw new MissingCredentialError(
      "The person does not have an existing credential.",
    );
  }

  await dependencies.credentials.upsert({
    ...credential,
    passwordHash: await dependencies.passwordHasher.hash(input.password),
  });
}
