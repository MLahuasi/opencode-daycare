/** Relationship a parent can have with a child. */
export type ParentRelationship = "mother" | "father" | "guardian";

/** Role assigned to a person in the daycare. */
export type PersonRole = "parent" | "personal";

/** Account lifecycle status assigned to a person. */
export type PersonStatus = "active" | "inactive" | "pending";

/** Lifecycle status assigned to a kid. */
export type KidStatus = "active" | "inactive";

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

/** Canonical persisted information for a kid. */
export type Kid = {
  id: string;
  slug: string;
  name: string;
  birthDate: string;
  roomId: string;
  enrollmentDate: string;
  medicalNotes: string;
  allergies: string;
  status: KidStatus;
};

/** Safe, derived data used by the client-side kid list and filter. */
export type KidListItem = {
  slug: string;
  name: string;
  room: string;
  initial: string;
  age: number;
  parentCount: number;
  avatarTone: string;
  shouldLinkParent: boolean;
  allergies: string[];
};
