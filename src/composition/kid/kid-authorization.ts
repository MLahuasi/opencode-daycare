import "server-only";

import { canManageKids, type PersonRoleCode } from "@/domain/person";
import {
  PostgresPersonRoleRepository,
  PostgresPostAccessRepository,
} from "@/infrastructure/persistence/postgres";
import { getPostgresRuntimeClient } from "../postgres-runtime";

/** Effective Kids authorization resolved from persisted roles and assignments. */
export type KidAuthorization = {
  assignedRoomIds: readonly string[];
  roles: readonly PersonRoleCode[];
  canManageRoom: (roomId: string) => boolean;
};

/**
 * Resolves the effective Kids capability for one daycare-scoped person.
 *
 * @param daycareId - Tenant identifier.
 * @param personId - Authenticated person identifier.
 * @returns Persisted roles, room assignments and the room capability predicate.
 */
export async function getKidAuthorization(
  daycareId: string,
  personId: string,
): Promise<KidAuthorization> {
  const client = getPostgresRuntimeClient();
  const [roles, assignedRoomIds] = await Promise.all([
    new PostgresPersonRoleRepository(client).findRoles(personId, daycareId),
    new PostgresPostAccessRepository(
      client,
      { getCurrentDaycareId: async () => daycareId },
    ).findStaffRoomIds(personId),
  ]);

  return {
    assignedRoomIds,
    roles,
    canManageRoom: (roomId) => canManageKids(roles, assignedRoomIds, roomId),
  };
}
