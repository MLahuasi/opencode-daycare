import "server-only";

import bcrypt from "bcryptjs";
import type { PasswordHasher } from "@/application/auth/ports";

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
}
