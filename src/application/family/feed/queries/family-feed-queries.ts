import {
  selectActiveFamilyKids,
  selectFamilyFeedPosts,
  type FamilyFeedFilter,
} from "@/domain/family";
import { hasPersonRole } from "@/domain/person";
import type {
  FamilyFeedContext,
  FamilyFeedProjection,
} from "../dto";
import type { FamilyFeedQueryDependencies } from "../ports";

/**
 * Loads the records authorized for a parent Family Feed context.
 *
 * @param dependencies - Abstract readers required by the query.
 * @param parentId - Authenticated parent's person identifier.
 * @returns The authorized family context.
 * @throws Error when the person is missing or is not a parent.
 */
export async function getFamilyFeedContext(
  dependencies: FamilyFeedQueryDependencies,
  parentId: string,
): Promise<FamilyFeedContext> {
  const [person, parentKids, kids, rooms] = await Promise.all([
    dependencies.people.findById(parentId),
    dependencies.parentKids.findByParentId(parentId),
    dependencies.directory.findKids(),
    dependencies.directory.findRooms(),
  ]);

  if (!person || person.status !== "active") {
    throw new Error("Authenticated person is not active in persistence.");
  }
  if (!hasPersonRole(person.roles, "parent")) {
    throw new Error("Family context is only available to parent accounts.");
  }

  const authorizedKidIds = new Set(parentKids.map((parentKid) => parentKid.kidId));
  const activeKids = selectActiveFamilyKids(kids, authorizedKidIds);
  const activeKidIds = new Set(activeKids.map((kid) => kid.id));
  const authorizedKids = activeKids;
  const authorizedParentKids = parentKids.filter((parentKid) =>
    activeKidIds.has(parentKid.kidId),
  );
  const authorizedRoomIds = new Set(authorizedKids.map((kid) => kid.roomId));
  const authorizedRooms = rooms.filter((room) => authorizedRoomIds.has(room.id));

  return {
    person,
    parentKids: authorizedParentKids,
    kids: authorizedKids,
    activeKids,
    rooms: authorizedRooms,
  };
}

/**
 * Builds the complete authorized Family Feed projection.
 *
 * @param dependencies - Abstract readers and media resolver required by the query.
 * @param parentId - Authenticated parent's person identifier.
 * @param selectedFilter - Child, room, or all-rooms filter.
 * @returns Feed context and filtered Posts.
 */
export async function getFamilyFeedProjection(
  dependencies: FamilyFeedQueryDependencies,
  parentId: string,
  selectedFilter: FamilyFeedFilter = { kind: "all" },
): Promise<FamilyFeedProjection> {
  const context = await getFamilyFeedContext(dependencies, parentId);
  const posts = await dependencies.posts.findForViewer(parentId);
  const selectedPosts = selectFamilyFeedPosts(
    posts,
    context.activeKids,
    context.rooms,
    selectedFilter,
  );

  return {
    context,
    posts: await dependencies.media.resolve(selectedPosts),
    selectedFilter,
  };
}
