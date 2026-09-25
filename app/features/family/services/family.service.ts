import "server-only";

import { requireActiveSession } from "@/auth";
import { getFeeds } from "@/app/features/feed/server";
import type { FeedPost } from "@/app/features/feed";
import { readCollection } from "@/app/infrastructure/persistence";
import type { Kid } from "@/app/features/kids/types";
import type { Person } from "@/app/features/people";
import type { Room } from "@/app/features/rooms";
import type {
  FamilyFeedFilter,
  FamilyFeedOption,
  ParentKid,
} from "../types";

/** Server-resolved data required to build a parent's authorized view. */
export type FamilyContext = {
  person: Person;
  parentKids: readonly ParentKid[];
  kids: readonly Kid[];
  activeKids: readonly Kid[];
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

  if (session.user.role !== "parent") {
    throw new Error("Family context is only available to parent accounts.");
  }

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
  const activeKids = kids.filter(
    (kid) => kid.status === "active" && authorizedRoomIds.has(kid.roomId),
  );

  return {
    person,
    parentKids: authorizedParentKids,
    kids: authorizedKids,
    activeKids,
    rooms: authorizedRooms,
  };
}

/**
 * Builds the server-authorized filter options for the family feed.
 *
 * @returns Active kid, authorized room, and all-rooms filter options.
 */
export async function getFamilyFeedOptions(): Promise<
  readonly FamilyFeedOption[]
> {
  const context = await getAuthenticatedFamilyContext();
  const activeRoomIds = new Set(context.activeKids.map((kid) => kid.roomId));
  const activeRooms = context.rooms.filter((room) => activeRoomIds.has(room.id));
  const options: FamilyFeedOption[] = context.activeKids.map((kid) => ({
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
    options.push({
      id: "all",
      label: "Todos",
      filter: { kind: "all" },
    });
  }

  return options;
}

/**
 * Builds the authorized chronological feed for the authenticated parent.
 *
 * @param filter - Optional authorized kid, room, or all-rooms filter.
 * @returns Posts matching the authorized filter, sorted newest first.
 */
export async function getFamilyFeed(
  filter: FamilyFeedFilter = { kind: "all" },
): Promise<readonly FeedPost[]> {
  const [context, posts] = await Promise.all([
    getAuthenticatedFamilyContext(),
    getFeeds(),
  ]);
  const kidIds = new Set(context.activeKids.map((kid) => kid.id));
  const activeRoomIds = new Set(context.activeKids.map((kid) => kid.roomId));
  const kidsById = new Map(context.activeKids.map((kid) => [kid.id, kid]));
  const roomIds = new Set(
    context.rooms
      .filter((room) => activeRoomIds.has(room.id))
      .map((room) => room.id),
  );

  if (filter.kind === "kid" && !kidIds.has(filter.id)) {
    return [];
  }

  if (filter.kind === "room" && !roomIds.has(filter.id)) {
    return [];
  }

  const authorizedPosts = posts.filter(
    (post) => {
      const isRoomAnnouncement =
        post.kidId === null && post.roomId !== null && roomIds.has(post.roomId);
      const targetKid = post.kidId ? kidsById.get(post.kidId) : undefined;
      const isAuthorizedKidPost = targetKid !== undefined;

      if (filter.kind === "kid") {
        return post.kidId === filter.id;
      }

      if (filter.kind === "room") {
        return (
          (isAuthorizedKidPost && targetKid.roomId === filter.id) ||
          (isRoomAnnouncement && post.roomId === filter.id)
        );
      }

      return isAuthorizedKidPost || isRoomAnnouncement;
    },
  );
  const uniquePosts = new Map(
    authorizedPosts.map((post) => [post.id, post]),
  );

  return [...uniquePosts.values()].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}
