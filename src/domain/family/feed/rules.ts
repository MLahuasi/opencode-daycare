import type { Kid } from "@/domain/kid";
import type { Room } from "@/domain/room";
import type {
  FamilyFeedFilter,
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
