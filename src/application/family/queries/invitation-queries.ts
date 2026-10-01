import { getInvitationStatus } from "@/src/domain/family";
import type { FamilyDependencies } from "../family-dependencies";
import type { InvitationTokenResolution } from "../dto/invitation";

/** Resolves an invitation token without exposing invalid invitation data. */
export async function validateInvitationToken(
  dependencies: FamilyDependencies,
  code: string,
): Promise<InvitationTokenResolution> {
  const invitation = await dependencies.invitations.findByCode(code);

  if (!invitation) {
    return { status: "unknown", invitation: null, person: null };
  }

  const status = getInvitationStatus(invitation, dependencies.now());

  if (status !== "pending") {
    return { status, invitation: null, person: null };
  }

  const person = await dependencies.people.findById(invitation.personId);

  if (!person) {
    return { status: "unknown", invitation: null, person: null };
  }

  return { status: "valid", invitation, person };
}
