import "server-only";

import { requireActiveSession } from "@/auth";
import { readCollection } from "@/app/infrastructure/persistence";
import type { Kid } from "@/app/features/kids/types";
import type { Person } from "@/app/features/people";
import type { Room } from "@/app/features/rooms";
import type { ParentKid } from "../types";

/** Server-resolved data required to build a parent's authorized view. */
export type FamilyContext = {
  person: Person;
  parentKids: readonly ParentKid[];
  kids: readonly Kid[];
  rooms: readonly Room[];
};

/**
 * Resolves the authenticated person's relationships, kids, and rooms.
 *
 * @returns The authenticated person and only the records authorized by their
 * relationships.
 */
export async function getAuthenticatedFamilyContext(): Promise<FamilyContext> {
  const session = await requireActiveSession();
  const [people, parentKids, kids, rooms] = await Promise.all([
    readCollection<Person>("people.json"),
    readCollection<ParentKid>("parent-kids.json"),
    readCollection<Kid>("kids.json"),
    readCollection<Room>("rooms.json"),
  ]);
  const person = people.find((candidate) => candidate.id === session.user.personId);

  if (!person) {
    throw new Error("Authenticated person was not found in persistence.");
  }

  const authorizedParentKids = parentKids.filter(
    (parentKid) => parentKid.parentId === person.id,
  );
  const authorizedKidIds = new Set(
    authorizedParentKids.map((parentKid) => parentKid.kidId),
  );
  const authorizedKids = kids.filter((kid) => authorizedKidIds.has(kid.id));
  const authorizedRoomIds = new Set(authorizedKids.map((kid) => kid.roomId));
  const authorizedRooms = rooms.filter((room) => authorizedRoomIds.has(room.id));

  return {
    person,
    parentKids: authorizedParentKids,
    kids: authorizedKids,
    rooms: authorizedRooms,
  };
}
