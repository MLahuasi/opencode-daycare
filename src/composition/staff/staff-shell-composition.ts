import "server-only";

import type {
  StaffNavigationProjection,
  StaffShellReader,
} from "@/application/staff";
import { PostgresStaffShellRepository } from "@/infrastructure/persistence/postgres";
import { getPostgresRuntimeClient } from "../postgres-runtime";

function formatRooms(roomNames: readonly string[]): string {
  return roomNames.length > 0 ? `Salas ${roomNames.join(", ")}` : "Sin salas";
}

function formatProfileRole(
  jobTitle: string | null,
  roomNames: readonly string[],
): string {
  const title = jobTitle?.trim() || "Personal";
  return roomNames.length > 0
    ? `${title} · ${roomNames.join(", ")}`
    : title;
}

/**
 * Creates the PostgreSQL-backed Staff Shell projection composition.
 *
 * @returns A function that projects Staff Shell data for one session identity.
 */
export function createStaffShellComposition(): {
  getNavigation(
    daycareId: string,
    personId: string,
  ): Promise<StaffNavigationProjection | null>;
} {
  const reader: StaffShellReader = new PostgresStaffShellRepository(
    getPostgresRuntimeClient(),
  );

  return {
    async getNavigation(daycareId, personId) {
      const record = await reader.findByPerson(daycareId, personId);
      if (!record) return null;

      return {
        brand: {
          name: record.brandName,
          room: formatRooms(record.roomNames),
        },
        profile: {
          initial: record.personName.trim().charAt(0).toUpperCase() || "?",
          name: record.personName,
          role: formatProfileRole(record.jobTitle, record.roomNames),
        },
      };
    },
  };
}
