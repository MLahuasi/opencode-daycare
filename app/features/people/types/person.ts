/** Role assigned to a person in the daycare. */
export type PersonRole = "parent" | "personal";

/** Account lifecycle status assigned to a person. */
export type PersonStatus = "active" | "inactive" | "pending";

/** A person who participates in the daycare community. */
export type Person = {
  id: string;
  name: string;
  email: string;
  role: PersonRole;
  status: PersonStatus;
};