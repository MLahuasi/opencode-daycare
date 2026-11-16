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

/** Capability represented by one or more persisted person roles. */
export type PersonCapability =
  | "family-feed"
  | "manage-posts"
  | "staff-shell";

/** Checks whether a role set contains one persisted role. */
export function hasPersonRole(
  roles: PersonRoles,
  role: PersonRole,
): boolean {
  return roles.includes(role);
}

/** Checks whether a role set grants one application capability. */
export function hasPersonCapability(
  roles: PersonRoles,
  capability: PersonCapability,
): boolean {
  switch (capability) {
    case "family-feed":
      return hasPersonRole(roles, "parent");
    case "manage-posts":
      return hasPersonRole(roles, "teacher");
    case "staff-shell":
      return hasPersonRole(roles, "personal");
  }
}

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
