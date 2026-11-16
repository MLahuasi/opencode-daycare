import type { DaycareScoped } from "@/domain/daycare";

/** Role codes persisted in the daycare role catalog. */
export const PERSON_ROLE_CODES = [
  "admin",
  "personal",
  "teacher",
  "parent",
] as const;

/** Role assigned to a person in a daycare. */
export type PersonRole = (typeof PERSON_ROLE_CODES)[number];

/** The complete set of roles assigned to a person in one daycare. */
export type PersonRoles = readonly PersonRole[];

/** Account lifecycle status assigned to a person. */
export type PersonStatus = "active" | "inactive" | "pending";

/** A person who participates in the daycare community. */
export type Person = DaycareScoped & {
  id: string;
  name: string;
  email: string;
  roles: PersonRoles;
  status: PersonStatus;
};
