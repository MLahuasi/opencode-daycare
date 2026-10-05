import "server-only";

import type { AuthDependencies } from "@/application/auth";
import { BcryptPasswordHasher } from "@/infrastructure/adapters/password";
import { CredentialRepository } from "@/infrastructure/persistence/repositories";
import { randomUUID } from "node:crypto";

/** Concrete server-only dependencies required by Auth use cases. */
export type AuthComposition = AuthDependencies;

/**
 * Creates the concrete server-side adapters for Auth use cases.
 *
 * @returns The credential, hashing and identifier dependencies.
 */
export function createAuthComposition(): AuthComposition {
  return {
    credentials: new CredentialRepository(),
    passwordHasher: new BcryptPasswordHasher(),
    identifiers: {
      /**
       * Creates a random persisted identifier.
       *
       * @returns A UUID identifier.
       */
      create: () => randomUUID(),
    },
  };
}
