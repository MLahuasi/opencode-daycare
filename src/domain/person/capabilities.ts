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

/**
 * Returns whether a teacher can manage Kids assigned to a specific room.
 *
 * The room assignment is part of the effective capability: the `teacher` role
 * alone must never grant access to every room in the daycare.
 *
 * @param roles - Persisted roles assigned to the person.
 * @param assignedRoomIds - Room identifiers assigned to the person.
 * @param roomId - Room identifier containing the target Kid.
 * @returns Whether the person has `manage-kids` for the target room.
 */
export function canManageKids(
  roles: readonly PersonRoleCode[],
  assignedRoomIds: readonly string[],
  roomId: string,
): boolean {
  return (
    hasCapability(roles, "manage-kids") && assignedRoomIds.includes(roomId)
  );
}

/** Returns whether a role set contains one persisted role code. */
export function hasRole(
  roles: readonly PersonRoleCode[],
  role: PersonRoleCode,
): boolean {
  return roles.includes(role);
}
