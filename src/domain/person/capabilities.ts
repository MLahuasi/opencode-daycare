import type { PersonCapability, PersonRoleCode } from "./person";

const capabilityRoles: Record<PersonCapability, readonly PersonRoleCode[]> = {
  "staff-shell": ["personal"],
  "manage-kids": ["teacher"],
  "manage-posts": ["teacher"],
  "family-feed": ["parent"],
};

/** Returns whether a set of persisted roles grants the requested capability. */
export function hasCapability(
  roles: readonly PersonRoleCode[],
  capability: PersonCapability,
): boolean {
  return capabilityRoles[capability].some((role) => roles.includes(role));
}

/** Returns whether a role set contains one persisted role code. */
export function hasRole(
  roles: readonly PersonRoleCode[],
  role: PersonRoleCode,
): boolean {
  return roles.includes(role);
}
