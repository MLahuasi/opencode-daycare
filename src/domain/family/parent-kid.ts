import type { ParentRelationship } from "./parent-relationship";

/** Persisted relationship between a parent and a kid. */
export type ParentKid = {
  id: string;
  parentId: string;
  kidId: string;
  relationship: ParentRelationship;
  photoSharingConsent: boolean;
};
