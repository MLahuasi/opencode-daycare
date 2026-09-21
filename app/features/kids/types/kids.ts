import type { Person } from "@/app/features/people";

/** Relationship a parent can have with a child. */
export type ParentRelationship = "mother" | "father" | "guardian";

/** A parent-to-kid relationship and its photo sharing consent. */
export type ParentKid = {
  id: string;
  parentId: string;
  kidId: string;
  relationship: ParentRelationship;
  photoSharingConsent: boolean;
};

/** Minimal person data required to render a linked parent in a kid profile. */
export type LinkedParent = Pick<Person, "id" | "name" | "status"> & {
  relationship: ParentRelationship;
};