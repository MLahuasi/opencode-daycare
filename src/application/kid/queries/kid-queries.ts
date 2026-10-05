import type { Kid } from "@/domain/kid";
import type { Person } from "@/domain/person";
import type { Room } from "@/domain/room";
import type { KidDependencies } from "../kid-dependencies";
import type { LinkedParent } from "../dto";
import type { ParentKidRecord } from "../ports";

/** Reads all persisted Kids. */
export function getKids(dependencies: KidDependencies): Promise<readonly Kid[]> {
  return dependencies.kids.findAll();
}

/** Reads all persisted Rooms. */
export function getRooms(
  dependencies: KidDependencies,
): Promise<readonly Room[]> {
  return dependencies.rooms.findAll();
}

/** Reads all persisted People. */
export function getPeople(
  dependencies: KidDependencies,
): Promise<readonly Person[]> {
  return dependencies.people.findAll();
}

/** Reads all persisted parent-to-kid relationships. */
export function getParentKids(
  dependencies: KidDependencies,
): Promise<readonly ParentKidRecord[]> {
  return dependencies.parentKids.findAll();
}

/** Finds a Kid by its stable identifier. */
export function getKidById(
  dependencies: KidDependencies,
  id: string,
): Promise<Kid | null> {
  return dependencies.kids.findById(id);
}

/** Finds a Kid by its public profile slug. */
export function getKidBySlug(
  dependencies: KidDependencies,
  slug: string,
): Promise<Kid | null> {
  return dependencies.kids.findBySlug(slug);
}

/** Resolves the Room assigned to a Kid. */
export function getKidRoom(
  dependencies: KidDependencies,
  kid: Pick<Kid, "roomId">,
): Promise<Room | null> {
  return dependencies.rooms.findById(kid.roomId);
}

/**
 * Resolves safe parent data linked to a Kid.
 *
 * @param dependencies - Ports used to read relationships and people.
 * @param kidId - Stable identifier of the Kid.
 * @returns Linked parents whose people records still exist.
 */
export async function getLinkedParentsByKidId(
  dependencies: KidDependencies,
  kidId: string,
): Promise<LinkedParent[]> {
  const [parentKids, people] = await Promise.all([
    dependencies.parentKids.findByKidId(kidId),
    dependencies.people.findAll(),
  ]);

  return parentKids.flatMap((parentKid) => {
    const person = people.find((candidate) => candidate.id === parentKid.parentId);

    if (!person) {
      return [];
    }

    return [
      {
        id: person.id,
        name: person.name,
        relationship: parentKid.relationship,
        status: person.status,
      },
    ];
  });
}
