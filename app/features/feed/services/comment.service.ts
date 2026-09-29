import "server-only";

import { randomUUID } from "node:crypto";
import {
  readCollection,
  withJsonTransaction,
  writeCollection,
} from "@/app/infrastructure/persistence";
import type { FeedComment } from "../types";

/** Values required to create a persisted feed comment. */
export type CreateFeedCommentInput = {
  authorId: string;
  body: string;
  postId: string;
};

/** Values required to update a persisted feed comment. */
export type UpdateFeedCommentInput = {
  authorId: string;
  body: string;
  commentId: string;
};

/**
 * Finds one persisted feed comment by stable identifier.
 *
 * @param commentId - Stable identifier of the comment.
 * @returns The matching comment, or null when it does not exist.
 */
export async function getFeedCommentById(
  commentId: string,
): Promise<FeedComment | null> {
  const comments = await readCollection<FeedComment>("feed-comments.json");
  return comments.find((comment) => comment.id === commentId) ?? null;
}

/**
 * Creates and atomically persists a feed comment.
 *
 * @param input - Authorized and validated comment values.
 * @returns The newly persisted comment.
 */
export function createFeedComment(
  input: CreateFeedCommentInput,
): Promise<FeedComment> {
  return withJsonTransaction(["feed-comments.json"], async () => {
    const comments = await readCollection<FeedComment>("feed-comments.json");
    const comment: FeedComment = {
      id: randomUUID(),
      postId: input.postId,
      authorId: input.authorId,
      body: input.body,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    await writeCollection("feed-comments.json", [...comments, comment]);
    return comment;
  });
}

/**
 * Updates a comment owned by the authenticated person atomically.
 *
 * @param input - Authorized and validated comment values.
 * @returns The updated comment, or null when it is missing or not owned by the person.
 */
export function updateFeedComment(
  input: UpdateFeedCommentInput,
): Promise<FeedComment | null> {
  return withJsonTransaction(["feed-comments.json"], async () => {
    const comments = await readCollection<FeedComment>("feed-comments.json");
    const commentIndex = comments.findIndex(
      (comment) =>
        comment.id === input.commentId && comment.authorId === input.authorId,
    );

    if (commentIndex === -1) return null;

    const currentComment = comments[commentIndex];
    const updatedComment: FeedComment = {
      ...currentComment,
      body: input.body,
      updatedAt: new Date().toISOString(),
    };
    const updatedComments = [...comments];
    updatedComments[commentIndex] = updatedComment;

    await writeCollection("feed-comments.json", updatedComments);
    return updatedComment;
  });
}
