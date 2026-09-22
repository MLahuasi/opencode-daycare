import type { ParentRelationship } from "@/app/features/family";

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
