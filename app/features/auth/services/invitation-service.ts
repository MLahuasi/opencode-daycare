import "server-only";

import { randomUUID } from "node:crypto";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/app/infrastructure/persistence";
import type { ParentRelationship } from "@/app/features/family";
import { createInvitationCode, getInvitationExpiration } from "../utils/invitation-code";
import type { Invitation } from "../types";

/**
 * Reads the canonical Invitation collection from disk.
 *
 * @returns A freshly parsed, immutable list of Invitations.
 */
export function getInvitations(): Promise<readonly Invitation[]> {
  return readCollection<Invitation>("invitation.json");
}

/**
 * Creates and persists a pending parent invitation.
 *
 * @param values - Parent and kid references for the invitation.
 * @param values.personId - Pending parent identifier.
 * @param values.kidId - Kid identifier receiving the invitation.
 * @param values.relationship - Parent's relationship with the kid.
 * @returns The newly persisted invitation.
 */
export function createPendingInvitation(values: {
  personId: string;
  kidId: string;
  relationship: ParentRelationship;
}): Promise<Invitation> {
  return withWriteLock(async () => {
    const invitations = await readCollection<Invitation>("invitation.json");
    const invitation: Invitation = {
      id: randomUUID(),
      personId: values.personId,
      kidId: values.kidId,
      relationship: values.relationship,
      code: createInvitationCode(invitations.map((candidate) => candidate.code)),
      expiresAt: getInvitationExpiration(),
      sentAt: null,
      acceptedAt: null,
    };

    await writeCollection("invitation.json", [...invitations, invitation]);

    return invitation;
  });
}

/**
 * Marks an invitation as sent after the mail provider accepts it.
 *
 * @param id - Stable invitation identifier to update.
 * @param sentAt - ISO instant when the provider accepted the message.
 * @returns The updated invitation, or `null` when it no longer exists.
 */
export function markInvitationSent(
  id: string,
  sentAt: string,
): Promise<Invitation | null> {
  return withWriteLock(async () => {
    const invitations = await readCollection<Invitation>("invitation.json");
    const invitationIndex = invitations.findIndex((invitation) => invitation.id === id);

    if (invitationIndex === -1) {
      return null;
    }

    const updatedInvitation: Invitation = {
      ...invitations[invitationIndex],
      sentAt,
    };
    const updatedInvitations = [...invitations];
    updatedInvitations[invitationIndex] = updatedInvitation;

    await writeCollection("invitation.json", updatedInvitations);

    return updatedInvitation;
  });
}
