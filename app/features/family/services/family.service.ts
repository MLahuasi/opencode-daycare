import "server-only";

import { requireActiveSession } from "@/auth";
import { getFeeds } from "@/app/features/feed/server";
import type { FeedPost } from "@/app/features/feed";
import { readCollection } from "@/app/infrastructure/persistence";
import type { Kid } from "@/app/features/kids/types";
import type { Person } from "@/app/features/people";
import type { Room } from "@/app/features/rooms";
import type {
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
  const activeKids = authorizedKids.filter((kid) => kid.status === "active");
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
 * @returns Posts addressed to the parent's kids or their rooms.
 */
export async function getFamilyFeed(): Promise<readonly FeedPost[]> {
  const [context, posts] = await Promise.all([
    getAuthenticatedFamilyContext(),
    getFeeds(),
  ]);
  const kidIds = new Set(context.kids.map((kid) => kid.id));
  const roomIds = new Set(context.rooms.map((room) => room.id));
  const authorizedPosts = posts.filter(
    (post) =>
      (post.kidId !== null && kidIds.has(post.kidId)) ||
      (post.kidId === null && post.roomId !== null && roomIds.has(post.roomId)),
  );
  const uniquePosts = new Map(
    authorizedPosts.map((post) => [post.id, post]),
  );

  return [...uniquePosts.values()].sort(
    (first, second) =>
      new Date(second.dateTime).getTime() - new Date(first.dateTime).getTime(),
  );
}
