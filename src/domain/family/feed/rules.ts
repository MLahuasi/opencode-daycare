import type { Kid } from "@/src/domain/kid";
import type { Room } from "@/src/domain/room";
import type {
  FamilyFeedFilter,
  FamilyFeedOption,
  FamilyFeedPost,
} from "./family-feed";

/**
 * Selects active children whose rooms belong to the authorized room set.
 *
 * @param kids - Children available in the daycare.
 * @param authorizedRoomIds - Room identifiers visible to the family.
 * @returns Active children in authorized rooms.
 */
export function selectActiveFamilyKids(
  kids: readonly Kid[],
  authorizedRoomIds: ReadonlySet<string>,
): readonly Kid[] {
  return kids.filter(
    (kid) => kid.status === "active" && authorizedRoomIds.has(kid.roomId),
  );
}

/**
 * Builds filter options from active children and their authorized rooms.
 *
 * @param activeKids - Active children visible to the family.
 * @param rooms - Rooms authorized for the family.
 * @returns Child, room, and optional all-rooms filter options.
 */
export function buildFamilyFeedOptions(
  activeKids: readonly Kid[],
  rooms: readonly Room[],
): readonly FamilyFeedOption[] {
  const activeRoomIds = new Set(activeKids.map((kid) => kid.roomId));
  const activeRooms = rooms.filter((room) => activeRoomIds.has(room.id));
  const options: FamilyFeedOption[] = activeKids.map((kid) => ({
    id: kid.id,
    label: kid.name,
    filter: { kind: "kid", id: kid.id },
  }));

  options.push(
    ...activeRooms.map((room) => ({
      id: room.id,
      label: room.name,
      filter: { kind: "room", id: room.id } as const,
    })),
  );

  if (activeRooms.length > 1) {
    options.push({ id: "all", label: "Todos", filter: { kind: "all" } });
  }

  return options;
}

/**
 * Selects, deduplicates, and sorts posts visible for a family filter.
 *
 * @param posts - Posts available before family visibility filtering.
 * @param activeKids - Active children visible to the family.
 * @param rooms - Rooms authorized for the family.
 * @param filter - Child, room, or all-rooms filter to apply.
 * @returns Authorized posts sorted newest first.
 */
export function selectFamilyFeedPosts<T extends FamilyFeedPost>(
  posts: readonly T[],
  activeKids: readonly Kid[],
  rooms: readonly Room[],
  filter: FamilyFeedFilter = { kind: "all" },
): readonly T[] {
  const kidIds = new Set(activeKids.map((kid) => kid.id));
  const activeRoomIds = new Set(activeKids.map((kid) => kid.roomId));
  const kidsById = new Map(activeKids.map((kid) => [kid.id, kid]));
  const roomIds = new Set(
    rooms
      .filter((room) => activeRoomIds.has(room.id))
      .map((room) => room.id),
  );

  if (filter.kind === "kid" && !kidIds.has(filter.id)) return [];
  if (filter.kind === "room" && !roomIds.has(filter.id)) return [];

  const authorizedPosts = posts.filter((post) => {
    const isRoomAnnouncement =
      post.kidId === null && post.roomId !== null && roomIds.has(post.roomId);
    const targetKid = post.kidId ? kidsById.get(post.kidId) : undefined;
    const isAuthorizedKidPost = targetKid !== undefined;

    if (filter.kind === "kid") return post.kidId === filter.id;

    if (filter.kind === "room") {
      return (
        (isAuthorizedKidPost && targetKid.roomId === filter.id) ||
        (isRoomAnnouncement && post.roomId === filter.id)
      );
    }

    return isAuthorizedKidPost || isRoomAnnouncement;
  });

  const uniquePosts = new Map(authorizedPosts.map((post) => [post.id, post]));

  return [...uniquePosts.values()].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}
