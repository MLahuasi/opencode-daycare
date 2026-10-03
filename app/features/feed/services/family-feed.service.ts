import "server-only";

import { requireActiveSession } from "@/auth";
import {
  getFeeds,
  resolveFeedMediaUrls,
} from "./feed.service";
import type { FeedPost } from "@/app/features/feed";
import { readCollection } from "@/src/infrastructure/persistence";
import type { Kid } from "@/src/domain/kid";
import type { Person } from "@/src/domain/person";
import type { Room } from "@/src/domain/room";
import type {
  FamilyFeedFilter,
  FamilyFeedOption,
} from "@/src/domain/family/feed";
import type { ParentKid } from "@/src/domain/family";
import {
  buildFamilyFeedOptions,
  selectActiveFamilyKids,
  selectFamilyFeedPosts,
} from "@/src/domain/family/feed";

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
  const activeKids = selectActiveFamilyKids(kids, authorizedRoomIds);

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
  return buildFamilyFeedOptions(context.activeKids, context.rooms);
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
  const context = await getAuthenticatedFamilyContext();
  const posts = await getFeeds({
    resolveMediaUrls: false,
    viewerId: context.person.id,
  });
  const selectedPosts = selectFamilyFeedPosts(
    posts,
    context.activeKids,
    context.rooms,
    filter,
  );

  return resolveFeedMediaUrls(selectedPosts);
}

/**
 * Loads the posts visible to an authenticated person for engagement actions.
 *
 * @returns Posts the current parent or staff member can engage with.
 */
export async function getAuthorizedEngagementPosts(): Promise<readonly FeedPost[]> {
  const session = await requireActiveSession();

  if (session.user.role === "parent") {
    return getFamilyFeed({ kind: "all" });
  }

  return getFeeds({
    resolveMediaUrls: false,
    viewerId: session.user.personId,
  });
}
