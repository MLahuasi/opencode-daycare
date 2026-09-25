import "server-only";

import { readCollection } from "@/app/infrastructure/persistence";
import type { Kid } from "@/app/features/kids";
import type { Room } from "@/app/features/rooms";
import { getAuthorizedStaffRooms } from "./staff-room.service";

/** Active children and rooms available to the authenticated staff member. */
export type PostFormTargets = {
  kids: readonly Kid[];
  rooms: readonly Room[];
};

/**
 * Resolves the only child and room destinations available to a staff member.
 *
 * @param personId - Person identifier of the authenticated staff member.
 * @returns Active children in assigned rooms and the assigned rooms themselves.
 */
export async function getAuthorizedPostTargets(
  personId: string,
): Promise<PostFormTargets> {
  const [rooms, kids] = await Promise.all([
    getAuthorizedStaffRooms(personId),
    readCollection<Kid>("kids.json"),
  ]);
  const roomIds = new Set(rooms.map((room) => room.id));

  return {
    kids: kids.filter((kid) => kid.status === "active" && roomIds.has(kid.roomId)),
    rooms,
  };
}
