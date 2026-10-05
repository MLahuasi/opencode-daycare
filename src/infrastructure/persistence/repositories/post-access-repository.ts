import "server-only";

import type { PostAccessRepository } from "@/application/post/ports";
import type { Kid } from "@/domain/kid";
import type { ParentKid } from "@/domain/family";
import {
  readCollection,
} from "@/infrastructure/persistence";

type StaffRoomAssignment = {
  personId: string;
  roomId: string;
};

/** JSON-backed access data adapter for Post authorization. */
export class JsonPostAccessRepository implements PostAccessRepository {
  /**
   * Lists rooms assigned to a staff member.
   *
   * @param personId - Stable identifier of the staff member.
   * @returns Room identifiers assigned to the staff member.
   */
  async findStaffRoomIds(personId: string): Promise<readonly string[]> {
    const assignments = await readCollection<StaffRoomAssignment>("staff-rooms.json");
    return assignments
      .filter((assignment) => assignment.personId === personId)
      .map((assignment) => assignment.roomId);
  }

  /**
   * Lists kids related to a parent.
   *
   * @param personId - Stable identifier of the parent.
   * @returns Kid identifiers linked to the parent.
   */
  async findParentKidIds(personId: string): Promise<readonly string[]> {
    const relationships = await readCollection<ParentKid>("parent-kids.json");
    return relationships
      .filter((relationship) => relationship.parentId === personId)
      .map((relationship) => relationship.kidId);
  }

  /**
   * Finds a kid by stable identifier.
   *
   * @param id - Stable identifier of the kid.
   * @returns The matching kid, or null when it does not exist.
   */
  async findKidById(id: string): Promise<Kid | null> {
    const kids = await readCollection<Kid>("kids.json");
    return kids.find((kid) => kid.id === id) ?? null;
  }

  /**
   * Lists active kids from a set of identifiers.
   *
   * @param ids - Kid identifiers to inspect.
   * @returns Active kids matching the supplied identifiers.
   */
  async findActiveKidsByIds(ids: readonly string[]): Promise<readonly Kid[]> {
    const idSet = new Set(ids);
    const kids = await readCollection<Kid>("kids.json");
    return kids.filter((kid) => kid.status === "active" && idSet.has(kid.id));
  }
}
