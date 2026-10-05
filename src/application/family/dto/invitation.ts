import type { Invitation, ParentRelationship } from "@/domain/family";
import type { Person } from "@/domain/person";

/** Values required to start a parent invitation. */
export type CreateInvitationInput = {
  /** Parent display name. */
  name: string;
  /** Parent email address. */
  email: string;
  /** Stable kid identifier. */
  kidId: string;
  /** Parent relationship with the kid. */
  relationship: ParentRelationship;
};

/** Result returned after an invitation and its pending person are created. */
export type CreatedInvitation = {
  /** Newly created invitation. */
  invitation: Invitation;
  /** Pending person associated with the invitation. */
  person: Person;
};

/** Public status returned when resolving an invitation token. */
export type InvitationTokenStatus = "unknown" | "expired" | "accepted" | "valid";

/** Safe projection of an invitation token resolution. */
export type InvitationTokenResolution = {
  /** Public token status. */
  status: InvitationTokenStatus;
  /** Invitation data only when the token is valid. */
  invitation: Invitation | null;
  /** Person data only when the token is valid. */
  person: Person | null;
};

/** Values required to accept an invitation and activate its account. */
export type AcceptInvitationInput = {
  /** Token received in the invitation URL. */
  code: string;
  /** Email address supplied by the parent. */
  email: string;
  /** New password for a pending parent account. */
  password?: string;
  /** Whether photo sharing is allowed. */
  photoSharingConsent: boolean;
};
