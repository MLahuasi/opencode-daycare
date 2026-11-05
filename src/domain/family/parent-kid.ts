import type { ParentRelationship } from "./parent-relationship";
import type { DaycareScoped } from "@/domain/daycare";

/** Persisted relationship between a parent and a kid. */
export type ParentKid = DaycareScoped & {
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
