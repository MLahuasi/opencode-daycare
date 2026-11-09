import "server-only";

import type { StaffNavigationConfig } from "@/presentation/layout";
import { PostgresStaffShellRepository } from "@/infrastructure/persistence/postgres";
import { staffNavigationConfig } from "@/presentation/navigation";
import { getPostgresRuntimeClient } from "../postgres-runtime";
import type { StaffShellRow } from "@/infrastructure/persistence/postgres";

function formatRooms(roomNames: readonly string[]): string {
  return roomNames.length > 0 ? `Salas ${roomNames.join(", ")}` : "Sin salas";
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/** Projects PostgreSQL Staff Shell data into the presentation navigation contract. */
export function projectStaffNavigation(row: StaffShellRow): StaffNavigationConfig {
  const rooms = formatRooms(row.roomNames);

  return {
    ...staffNavigationConfig,
    brand: {
      name: row.brandName,
      room: rooms,
    },
    profile: {
      initial: getInitial(row.personName),
      name: row.personName,
      role: `${row.jobTitle?.trim() || "Personal"} · ${rooms.replace(/^Salas /, "")}`,
    },
  };
}

/** Builds the Staff Shell navigation from tenant-scoped PostgreSQL data. */
export async function getStaffNavigation(
  daycareId: string,
  personId: string,
): Promise<StaffNavigationConfig | null> {
  const row = await new PostgresStaffShellRepository(
    getPostgresRuntimeClient(),
  ).findByPerson(daycareId, personId);

  if (!row) return null;

  return projectStaffNavigation(row);
}
