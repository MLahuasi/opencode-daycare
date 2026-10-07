import type { PostMedia } from "./media";

/** Allowed categories for a Post. */
export type PostType =
  | "food"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "announcement";

/** Derived engagement values rendered by a Post projection. */
export type PostEngagement = {
  reactionCount: number;
  commentCount: number;
  viewerHasLoved: boolean;
};

/** Persisted Post content without derived engagement values. */
export type PersistedPost = {
  id: string;
  type: PostType;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  media: PostMedia[];
  kidIds: string[];
  roomId: string | null;
};

/** Projected Post content rendered by feed and detail views. */
export type Post = PersistedPost & {
  engagement: PostEngagement;
  /** Optional subject resolved by an application read projection. */
  subject?: string;
};

/**
 * Checks whether a Post type is supported by the domain.
 *
 * @param value - Candidate Post type.
 * @returns Whether the value is a supported Post type.
 */
export function isPostType(value: string): value is PostType {
  return [
    "food",
    "nap",
    "activity",
    "achievement",
    "mood",
    "announcement",
  ].includes(value);
}

/**
 * Checks whether a Post targets one or more kids or one room, but not both.
 *
 * @param post - Post to inspect.
 * @returns Whether the Post targets at least one kid or one room, but not both.
 */
export function hasSinglePostDestination(
  post: Pick<PersistedPost, "kidIds" | "roomId">,
): boolean {
  return (post.kidIds.length > 0) !== Boolean(post.roomId);
}

/**
 * Checks whether a Post is a room announcement.
 *
 * @param post - Post to inspect.
 * @returns Whether the Post targets a room.
 */
export function isRoomPost(
  post: Pick<PersistedPost, "roomId">,
): boolean {
  return post.roomId !== null;
}

/**
 * Checks whether a person authored a Post.
 *
 * @param post - Post to inspect.
 * @param personId - Person requesting the operation.
 * @returns Whether the person is the Post author.
 */
export function isPostAuthor(
  post: Pick<PersistedPost, "authorId">,
  personId: string,
): boolean {
  return post.authorId === personId;
}
