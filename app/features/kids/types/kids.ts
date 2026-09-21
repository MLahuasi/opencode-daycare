/** Relationship a parent can have with a child. */
export type ParentRelationship = "mother" | "father" | "guardian";

/** Role assigned to a person in the daycare. */
export type PersonRole = "parent" | "personal";

/** Account lifecycle status assigned to a person. */
export type PersonStatus = "active" | "inactive" | "pending";

/** A daycare room available for kid assignment. */
export type Room = {
  id: string;
  name: string;
};

/** A person who participates in the daycare community. */
export type Person = {
  id: string;
  name: string;
  email: string;
  role: PersonRole;
  status: PersonStatus;
};

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