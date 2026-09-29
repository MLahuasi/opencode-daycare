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
