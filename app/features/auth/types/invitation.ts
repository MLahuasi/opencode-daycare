import type { ParentRelationship } from "@/src/domain/family";

/** Invitation sent to a person to activate their account. */
export type Invitation = {
  id: string;
  personId: string;
  kidId: string;
  relationship: ParentRelationship;
  code: string;
  expiresAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
};
