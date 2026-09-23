import "server-only";

import { randomUUID } from "node:crypto";
import type { Person } from "@/app/features/people";
import {
  readCollection,
  withJsonTransaction,
  withWriteLock,
  writeCollection,
} from "@/app/infrastructure/persistence";
import type { ParentKid, ParentRelationship } from "@/app/features/family";
import { createInvitationCode, getInvitationExpiration } from "../utils/invitation-code";
import { isInvitationExpired } from "../utils/invitation";
import type { Invitation } from "../types";

/** Error raised when an email cannot be reused for a parent invitation. */
export class ExistingPersonEmailError extends Error {
  constructor() {
    super("A person with this email already exists.");
    this.name = "ExistingPersonEmailError";
  }
}

/** Error raised when a parent is already linked to the requested kid. */
export class ExistingParentKidError extends Error {
  constructor() {
    super("This parent is already linked to the selected kid.");
    this.name = "ExistingParentKidError";
  }
}

/**
 * Creates and persists a pending parent person.
 *
 * @param values - Normalized parent identity values.
 * @param values.name - Parent's full name.
 * @param values.email - Parent's normalized email address.
 * @returns The newly persisted pending parent.
 * @throws When another person already uses the email address.
 */
export function createPendingParent(values: Pick<Person, "name" | "email">): Promise<Person> {
  return withWriteLock(async () => {
    const people = await readCollection<Person>("people.json");
    const emailAlreadyExists = people.some(
      (person) => person.email.trim().toLowerCase() === values.email,
    );

    if (emailAlreadyExists) {
      throw new ExistingPersonEmailError();
    }

    const parent: Person = {
      id: randomUUID(),
      name: values.name,
      email: values.email,
      role: "parent",
      status: "pending",
    };

    await writeCollection("people.json", [...people, parent]);

    return parent;
  });
}

/**
 * Creates or reuses a parent and creates an invitation in one JSON transaction.
 *
 * @param values - Normalized parent and invitation values.
 * @param values.name - Parent's full name.
 * @param values.email - Parent's normalized email address.
 * @param values.kidId - Kid identifier receiving the invitation.
 * @param values.relationship - Parent's relationship with the kid.
 * @returns The persisted parent and invitation for the requested kid.
 */
export function createPendingParentInvitation(values: {
  name: string;
  email: string;
  kidId: string;
  relationship: ParentRelationship;
}): Promise<{ parent: Person; invitation: Invitation }> {
  return withJsonTransaction(["people.json", "invitation.json"], async () => {
    const [people, invitations, parentKids] = await Promise.all([
      readCollection<Person>("people.json"),
      readCollection<Invitation>("invitation.json"),
      readCollection<ParentKid>("parent-kids.json"),
    ]);
    const existingPerson = people.find(
      (person) => person.email.trim().toLowerCase() === values.email,
    );

    if (existingPerson?.role === "parent" && existingPerson.status === "active") {
      const alreadyLinked = parentKids.some(
        (parentKid) =>
          parentKid.parentId === existingPerson.id &&
          parentKid.kidId === values.kidId,
      );

      if (alreadyLinked) {
        throw new ExistingParentKidError();
      }

      const existingInvitation = invitations.find(
        (invitation) =>
          invitation.personId === existingPerson.id &&
          invitation.kidId === values.kidId &&
          invitation.acceptedAt === null,
      );

      if (existingInvitation) {
        if (existingInvitation.sentAt !== null) {
          throw new ExistingPersonEmailError();
        }

        if (!isInvitationExpired(existingInvitation)) {
          return { parent: existingPerson, invitation: existingInvitation };
        }

        const updatedInvitation: Invitation = {
          ...existingInvitation,
          relationship: values.relationship,
          code: createInvitationCode(invitations.map((candidate) => candidate.code)),
          expiresAt: getInvitationExpiration(),
          sentAt: null,
        };
        await writeCollection(
          "invitation.json",
          invitations.map((invitation) =>
            invitation.id === updatedInvitation.id ? updatedInvitation : invitation,
          ),
        );

        return { parent: existingPerson, invitation: updatedInvitation };
      }

      const invitation: Invitation = {
        id: randomUUID(),
        personId: existingPerson.id,
        kidId: values.kidId,
        relationship: values.relationship,
        code: createInvitationCode(invitations.map((candidate) => candidate.code)),
        expiresAt: getInvitationExpiration(),
        sentAt: null,
        acceptedAt: null,
      };

      await writeCollection("invitation.json", [...invitations, invitation]);

      return { parent: existingPerson, invitation };
    }

    if (existingPerson) {
      const existingInvitation = invitations.find(
        (invitation) =>
          invitation.personId === existingPerson.id &&
          invitation.kidId === values.kidId &&
          invitation.acceptedAt === null,
      );

      if (
        existingPerson.role !== "parent" ||
        existingPerson.status !== "pending" ||
        !existingInvitation
      ) {
        throw new ExistingPersonEmailError();
      }

      if (existingInvitation.sentAt !== null) {
        throw new ExistingPersonEmailError();
      }

      if (!isInvitationExpired(existingInvitation)) {
        return { parent: existingPerson, invitation: existingInvitation };
      }

      const updatedInvitation: Invitation = {
        ...existingInvitation,
        code: createInvitationCode(invitations.map((candidate) => candidate.code)),
        expiresAt: getInvitationExpiration(),
        sentAt: null,
      };
      const updatedInvitations = invitations.map((invitation) =>
        invitation.id === updatedInvitation.id ? updatedInvitation : invitation,
      );

      await writeCollection("invitation.json", updatedInvitations);

      return { parent: existingPerson, invitation: updatedInvitation };
    }

    const parent: Person = {
      id: randomUUID(),
      name: values.name,
      email: values.email,
      role: "parent",
      status: "pending",
    };
    const invitation: Invitation = {
      id: randomUUID(),
      personId: parent.id,
      kidId: values.kidId,
      relationship: values.relationship,
      code: createInvitationCode(invitations.map((candidate) => candidate.code)),
      expiresAt: getInvitationExpiration(),
      sentAt: null,
      acceptedAt: null,
    };

    await writeCollection("people.json", [...people, parent]);
    await writeCollection("invitation.json", [...invitations, invitation]);

    return { parent, invitation };
  });
}
