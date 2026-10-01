/** Password hashing capability required by Auth use cases. */
export interface PasswordHasher {
  /**
   * Hashes a plaintext password.
   *
   * @param password - Plaintext password to hash.
   * @returns The encoded password hash.
   */
  hash(password: string): Promise<string>;

  /**
   * Compares a plaintext password with a stored hash.
   *
   * @param password - Plaintext password to compare.
   * @param hash - Encoded password hash to verify against.
   * @returns Whether the password matches the stored hash.
   */
  compare(password: string, hash: string): Promise<boolean>;
}
