import type { Invitation, ParentRelationship } from "@/src/domain/family";
import type { Person } from "@/src/domain/person";

/** Values required to start a parent invitation. */
export type CreateInvitationInput = {
  name: string;
  email: string;
  kidId: string;
  relationship: ParentRelationship;
};

/** Result returned after an invitation and its pending person are created. */
export type CreatedInvitation = {
  invitation: Invitation;
  person: Person;
};

/** Public status returned when resolving an invitation token. */
export type InvitationTokenStatus = "unknown" | "expired" | "accepted" | "valid";

/** Safe projection of an invitation token resolution. */
export type InvitationTokenResolution = {
  status: InvitationTokenStatus;
  invitation: Invitation | null;
  person: Person | null;
};

/** Values required to accept an invitation and activate its account. */
export type AcceptInvitationInput = {
  code: string;
  email: string;
  password?: string;
  photoSharingConsent: boolean;
};
