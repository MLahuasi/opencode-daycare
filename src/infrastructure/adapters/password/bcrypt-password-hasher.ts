import "server-only";

import bcrypt from "bcryptjs";
import type { PasswordHasher } from "@/application/auth/ports";

// Generated once from a fixed non-user password; never derive this per request.
const DUMMY_PASSWORD_HASH =
  "$2b$12$V4yIoFADSCLQgFVJVaXBBenF5LVTbAFB5L.6m6qzGEvsi4mwnWBbe";

/** Bcrypt-backed password hashing adapter. */
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds = 12;

  /**
   * Hashes a plaintext password with bcrypt.
   *
   * @param password - Plaintext password to hash.
   * @returns The encoded bcrypt hash.
   */
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compares a plaintext password with a bcrypt hash.
   *
   * @param password - Plaintext password to compare.
   * @param hash - Encoded bcrypt hash.
   * @returns Whether the password matches the hash.
   */
  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Performs a bcrypt comparison for a login without a stored credential.
   *
   * @param password - Normalized password submitted by the user.
   * @returns Whether the password matches the fixed dummy hash.
   */
  compareWithDummyHash(password: string): Promise<boolean> {
    return bcrypt.compare(password, DUMMY_PASSWORD_HASH);
  }
}
