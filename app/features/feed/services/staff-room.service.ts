import { readCollection } from "@/app/infrastructure";
import type { Room } from "@/app/features/rooms";
import type { StaffRoom } from "../types";

/**
 * Reads the staff-to-room authorization assignments.
 *
 * @returns All persisted staff room assignments.
 */
export function getStaffRoomAssignments(): Promise<readonly StaffRoom[]> {
  return readCollection<StaffRoom>("staff-rooms.json");
}

/**
 * Resolves the rooms a staff member is authorized to use as a post destination.
 *
 * @param personId - Person identifier of the authenticated staff member.
 * @returns Rooms assigned to the staff member, without duplicate rooms.
 */
export async function getAuthorizedStaffRooms(
  personId: string,
): Promise<readonly Room[]> {
  const [assignments, rooms] = await Promise.all([
    getStaffRoomAssignments(),
    readCollection<Room>("rooms.json"),
  ]);
  const assignedRoomIds = new Set(
    assignments
      .filter((assignment) => assignment.personId === personId)
      .map((assignment) => assignment.roomId),
  );

  return rooms.filter((room) => assignedRoomIds.has(room.id));
}
