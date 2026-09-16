/** Relationships a parent can have with a child. */
export type ParentRelationship = "mother" | "father" | "guardian";

/** Lifecycle status of a parent relationship in the daycare. */
export type ParentStatus = "active" | "inactive" | "pending";

/** A parent linked to one or more kids through fixture identifiers. */
export type Parent = {
  id: string;
  name: string;
  email: string;
  relationship: ParentRelationship;
  code: string;
  status: ParentStatus;
};

/** Canonical persisted information for a kid. */
export type Kid = {
  id: string;
  slug: string;
  name: string;
  birthDate: string;
  room: string;
  enrollmentDate: string;
  medicalNotes: string;
  parentIds: string[];
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
};
