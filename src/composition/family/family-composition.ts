import "server-only";

import type { FamilyAcceptanceDependencies } from "@/application/family";
import {
  PostgresInvitationRepository,
  PostgresParentKidRepository,
  PostgresPersonRepository,
  PostgresKidRepository,
  PostgresAuthTransactionRunner,
} from "@/infrastructure/persistence/postgres";
import { createAuthComposition } from "../auth";
import { JmlqInvitationMailer } from "@/infrastructure/adapters/mailer";
import { randomInt, randomUUID } from "node:crypto";
import { getPostgresRuntimeClient, getPostgresRuntimeDaycare } from "../postgres-runtime";
import type { CurrentDaycareReader } from "@/application/daycare/ports";

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
export function createFamilyComposition(daycareId?: string): FamilyComposition {
  const currentDaycare: CurrentDaycareReader = daycareId
    ? { getCurrentDaycareId: async () => daycareId }
    : getPostgresRuntimeDaycare();
  const client = getPostgresRuntimeClient();
  const invitations = new PostgresInvitationRepository(client);
  const people = new PostgresPersonRepository(client);
  const parentKids = new PostgresParentKidRepository(client);
  const kids = new PostgresKidRepository(client);

  return {
    ...createAuthComposition(),
    invitations: {
      findAll: async () => invitations.findAll(await currentDaycare.getCurrentDaycareId()),
      findByCode: async (code) => invitations.findByCode(await currentDaycare.getCurrentDaycareId(), code),
      create: (invitation) => invitations.create(invitation),
      markAccepted: async (id, acceptedAt) => invitations.markAccepted(await currentDaycare.getCurrentDaycareId(), id, acceptedAt),
      markSent: async (id, sentAt) => invitations.markSent(await currentDaycare.getCurrentDaycareId(), id, sentAt),
    },
    people: {
      findById: async (id) => people.findById(await currentDaycare.getCurrentDaycareId(), id),
      findByEmail: (tenant, email) => people.findByEmail(tenant, email),
      create: (person) => people.create(person),
      update: (person) => people.update(person),
    },
    parentKids: {
      findByParentAndKid: async (parentId, kidId) => parentKids.findByParentAndKid(await currentDaycare.getCurrentDaycareId(), parentId, kidId),
      create: (relationship) => parentKids.create(relationship),
    },
    kids: {
      findAll: async () => kids.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => kids.findById(await currentDaycare.getCurrentDaycareId(), id),
      findBySlug: async (slug) => kids.findBySlug(await currentDaycare.getCurrentDaycareId(), slug),
      findAllInRooms: async (roomIds) => kids.findAllInRooms(await currentDaycare.getCurrentDaycareId(), roomIds),
      findByIdInRooms: async (id, roomIds) => kids.findByIdInRooms(await currentDaycare.getCurrentDaycareId(), id, roomIds),
      findBySlugInRooms: async (slug, roomIds) => kids.findBySlugInRooms(await currentDaycare.getCurrentDaycareId(), slug, roomIds),
      create: (kid) => kids.create(kid),
      update: (kid) => kids.update(kid),
    },
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
    transaction: new PostgresAuthTransactionRunner(client),
    mailer: new JmlqInvitationMailer(),
  };
}
