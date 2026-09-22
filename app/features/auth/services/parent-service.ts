import "server-only";

import { randomUUID } from "node:crypto";
import type { Person } from "@/app/features/people";
import {
  readCollection,
  withJsonTransaction,
  withWriteLock,
  writeCollection,
} from "@/app/infrastructure/persistence";
import type { ParentRelationship } from "@/app/features/family";
import { createInvitationCode, getInvitationExpiration } from "../utils/invitation-code";
import type { Invitation } from "../types";

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
      throw new Error("A person with this email already exists.");
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
 * Creates a pending parent and invitation in one JSON transaction.
 *
 * @param values - Normalized parent and invitation values.
 * @param values.name - Parent's full name.
 * @param values.email - Parent's normalized email address.
 * @param values.kidId - Kid identifier receiving the invitation.
 * @param values.relationship - Parent's relationship with the kid.
 * @returns The newly persisted parent and invitation.
 */
export function createPendingParentInvitation(values: {
  name: string;
  email: string;
  kidId: string;
  relationship: ParentRelationship;
}): Promise<{ parent: Person; invitation: Invitation }> {
  return withJsonTransaction(["people.json", "invitation.json"], async () => {
    const [people, invitations] = await Promise.all([
      readCollection<Person>("people.json"),
      readCollection<Invitation>("invitation.json"),
    ]);
    const emailAlreadyExists = people.some(
      (person) => person.email.trim().toLowerCase() === values.email,
    );

    if (emailAlreadyExists) {
      throw new Error("A person with this email already exists.");
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
