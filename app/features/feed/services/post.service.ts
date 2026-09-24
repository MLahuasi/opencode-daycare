import "server-only";

import { randomUUID } from "node:crypto";
import {
  readCollection,
  withJsonTransaction,
  writeCollection,
} from "@/app/infrastructure/persistence";
import type { FeedMedia, FeedPost, PostType } from "../types";

/** Server-generated values required to create a feed post. */
export type CreateFeedPostInput = {
  authorId: string;
  body: string;
  kidId: string | null;
  media: FeedMedia[];
  roomId: string | null;
  subject: string;
  type: PostType;
};

/** Editable values applied to an existing feed post. */
export type UpdateFeedPostInput = Omit<CreateFeedPostInput, "authorId"> & {
  authorId: string;
};

function getPresentationValues(input: CreateFeedPostInput, timestamp: string) {
  const date = new Date(timestamp);

  return {
    subject: input.subject,
    initial: input.subject.charAt(0).toUpperCase(),
    time: date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }),
    dateTime: timestamp,
    authorLabel: "publicado por ti",
    recipient: input.kidId ? `familia de ${input.subject}` : "toda la sala",
    reactions: 0,
    comments: 0,
    hasMedia: input.media.length > 0,
  };
}

/**
 * Creates and atomically persists a feed post with server timestamps.
 *
 * @param input - Authorized and validated post values.
 * @returns The newly persisted post.
 */
export function createFeedPost(input: CreateFeedPostInput): Promise<FeedPost> {
  return withJsonTransaction(["feed.json"], async () => {
    const posts = await readCollection<FeedPost>("feed.json");
    const timestamp = new Date().toISOString();
    const post: FeedPost = {
      id: randomUUID(),
      type: input.type,
      authorId: input.authorId,
      ...getPresentationValues(input, timestamp),
      body: input.body,
      createdAt: timestamp,
      updatedAt: timestamp,
      media: input.media,
      kidId: input.kidId,
      roomId: input.roomId,
    };

    await writeCollection("feed.json", [...posts, post]);
    return post;
  });
}

/**
 * Updates an existing feed post while preserving its creation timestamp.
 *
 * @param id - Stable identifier of the post to update.
 * @param input - Authorized and validated post values.
 * @returns The updated post, or null when it does not exist.
 */
export function updateFeedPost(
  id: string,
  input: UpdateFeedPostInput,
): Promise<FeedPost | null> {
  return withJsonTransaction(["feed.json"], async () => {
    const posts = await readCollection<FeedPost>("feed.json");
    const postIndex = posts.findIndex((post) => post.id === id);

    if (postIndex === -1) return null;

    const currentPost = posts[postIndex];
    const updatedAt = new Date().toISOString();
    const updatedPost: FeedPost = {
      ...currentPost,
      type: input.type,
      authorId: input.authorId,
      ...getPresentationValues(input, updatedAt),
      body: input.body,
      updatedAt,
      media: input.media,
      kidId: input.kidId,
      roomId: input.roomId,
    };
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = updatedPost;

    await writeCollection("feed.json", updatedPosts);
    return updatedPost;
  });
}
