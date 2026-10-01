import type { ParentRelationship } from "./parent-relationship";

/** Persisted relationship between a parent and a kid. */
export type ParentKid = {
  /** Stable relationship identifier. */
  id: string;
  /** Stable parent person identifier. */
  parentId: string;
  /** Stable kid identifier. */
  kidId: string;
  /** Relationship of the person with the kid. */
  relationship: ParentRelationship;
  /** Whether the parent consents to photo sharing. */
  photoSharingConsent: boolean;
};
