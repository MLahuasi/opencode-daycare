import "server-only";

import type { FamilyAcceptanceDependencies } from "@/src/application/family";
import {
  InvitationRepository,
  ParentKidRepository,
  PersonRepository,
} from "@/src/infrastructure/persistence/repositories";
import { JsonTransactionRunner } from "@/src/infrastructure/persistence";
import { createAuthComposition } from "../auth";
import { randomInt, randomUUID } from "node:crypto";

const INVITATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITATION_CODE_LENGTH = 8;
const INVITATION_EXPIRATION_DAYS = 7;

/** Concrete server-only dependencies required by Family use cases. */
export type FamilyComposition = FamilyAcceptanceDependencies;

/**
 * Creates the concrete server-side adapters for Family and Auth use cases.
 *
 * @returns The persistence, provider and policy dependencies for invitations.
 */
export function createFamilyComposition(): FamilyComposition {
  return {
    ...createAuthComposition(),
    invitations: new InvitationRepository(),
    people: new PersonRepository(),
    parentKids: new ParentKidRepository(),
    identifiers: {
      /**
       * Creates a random persisted identifier.
       *
       * @returns A UUID identifier.
       */
      create: () => randomUUID(),
    },
    invitationCodes: {
      /**
       * Creates a unique invitation token.
       *
       * @param existingCodes - Tokens that must not be reused.
       * @returns A unique eight-character token.
       */
      create: (existingCodes) => {
        const existing = new Set(existingCodes.map((code) => code.toUpperCase()));
        let code = "";

        do {
          code = Array.from({ length: INVITATION_CODE_LENGTH }, () =>
            INVITATION_CODE_ALPHABET.charAt(
              randomInt(0, INVITATION_CODE_ALPHABET.length),
            ),
          ).join("");
        } while (existing.has(code));

        return code;
      },
    },
    invitationExpiration: {
      /**
       * Calculates the seven-day invitation expiration.
       *
       * @param now - Instant from which expiration is calculated.
       * @returns The expiration instant as an ISO string.
       */
      getExpiration: (now) =>
        new Date(
          now.getTime() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
        ).toISOString(),
    },
    clock: {
      /**
       * Returns the current instant.
       *
       * @returns The current date and time.
       */
      now: () => new Date(),
    },
    transaction: new JsonTransactionRunner(),
  };
}
