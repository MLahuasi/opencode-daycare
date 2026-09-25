import "server-only";

import { requireActiveSession } from "@/auth";
import { getAuthenticatedFamilyContext } from "@/app/features/family/server";
import {
  getAuthorizedStaffRooms,
  getFeeds,
} from "@/app/features/feed/server";
import type {
  FeedComment,
  FeedPost,
  FeedReaction,
} from "@/app/features/feed";
import type { Kid } from "@/app/features/kids/types";
import type { Person } from "@/app/features/people";
import type { Room } from "@/app/features/rooms";
import { readCollection } from "@/app/infrastructure/persistence";

/** Server-resolved records required to project an authorized post detail. */
export type AuthorizedPostData = {
  author: Person;
  comments: readonly FeedComment[];
  post: FeedPost;
  reactions: readonly FeedReaction[];
  recipientKid: Kid | null;
  recipientRoom: Room | null;
};

function isPostInAuthorizedRooms(
  post: FeedPost,
  kids: readonly Kid[],
  roomIds: ReadonlySet<string>,
): boolean {
  if (post.roomId !== null) {
    return roomIds.has(post.roomId);
  }

  const recipientKid = post.kidId
    ? kids.find((kid) => kid.id === post.kidId)
    : undefined;
  return recipientKid !== undefined && roomIds.has(recipientKid.roomId);
}

/**
 * Loads one post and its related records only after server-side authorization.
 *
 * @param id - Stable identifier of the requested post.
 * @returns Authorized post data, or null for an unknown or unauthorized post.
 */
export async function getAuthorizedPostData(
  id: string,
): Promise<AuthorizedPostData | null> {
  const session = await requireActiveSession();
  const posts = await getFeeds({ resolveMediaUrls: false });
  const post = posts.find((candidate) => candidate.id === id);

  if (!post) {
    return null;
  }

  const [people, kids, rooms] = await Promise.all([
    readCollection<Person>("people.json"),
    readCollection<Kid>("kids.json"),
    readCollection<Room>("rooms.json"),
  ]);
  let authorizedKids: readonly Kid[] = [];
  let authorizedRoomIds = new Set<string>();

  if (session.user.role === "personal") {
    const authorizedRooms = await getAuthorizedStaffRooms(session.user.personId);
    authorizedRoomIds = new Set(authorizedRooms.map((room) => room.id));
  } else {
    const familyContext = await getAuthenticatedFamilyContext();
    authorizedKids = familyContext.activeKids;
    authorizedRoomIds = new Set(authorizedKids.map((kid) => kid.roomId));
  }

  const postRecipientKid = post.kidId
    ? kids.find((kid) => kid.id === post.kidId) ?? null
    : null;
  const postRecipientRoom = post.roomId
    ? rooms.find((room) => room.id === post.roomId) ?? null
    : null;
  const familyCanSeeKid =
    session.user.role === "parent" &&
    postRecipientKid !== null &&
    authorizedKids.some((kid) => kid.id === postRecipientKid.id);
  const isAuthorized =
    isPostInAuthorizedRooms(post, kids, authorizedRoomIds) &&
    (session.user.role === "personal" || familyCanSeeKid || post.roomId !== null);

  if (!isAuthorized) {
    return null;
  }

  const [comments, reactions] = await Promise.all([
    readCollection<FeedComment>("feed-comments.json"),
    readCollection<FeedReaction>("feed-reactions.json"),
  ]);
  const author = people.find((person) => person.id === post.authorId);

  if (!author) {
    return null;
  }

  return {
    author,
    comments: comments.filter((comment) => comment.postId === post.id),
    post,
    reactions: reactions.filter((reaction) => reaction.postId === post.id),
    recipientKid: postRecipientKid,
    recipientRoom: postRecipientRoom,
  };
}
