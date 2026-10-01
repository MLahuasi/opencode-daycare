import "server-only";

import type { PostCommentRepository as PostCommentRepositoryPort } from "@/src/application/post/ports";
import type { PostComment } from "@/src/domain/post";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

/** JSON-backed persistence adapter for Post comments. */
export class PostCommentRepository implements PostCommentRepositoryPort {
  /**
   * Lists all persisted comments.
   *
   * @returns All Post comments from JSON persistence.
   */
  findAll(): Promise<readonly PostComment[]> {
    return readCollection<PostComment>("feed-comments.json");
  }

  /**
   * Finds one comment by stable identifier.
   *
   * @param id - Stable identifier of the comment.
   * @returns The matching comment, or null when it does not exist.
   */
  async findById(id: string): Promise<PostComment | null> {
    const comments = await this.findAll();
    return comments.find((comment) => comment.id === id) ?? null;
  }

  /**
   * Appends a comment.
   *
   * @param comment - Comment record to persist.
   * @returns A promise that resolves after persistence completes.
   */
  create(comment: PostComment): Promise<void> {
    return withWriteLock(async () => {
      const comments = await this.findAll();
      await writeCollection("feed-comments.json", [...comments, comment]);
    });
  }

  /**
   * Replaces a comment.
   *
   * @param comment - Updated comment record.
   * @returns The updated comment, or null when it does not exist.
   */
  update(comment: PostComment): Promise<PostComment | null> {
    return withWriteLock(async () => {
      const comments = await this.findAll();
      const index = comments.findIndex((candidate) => candidate.id === comment.id);
      if (index === -1) return null;

      const updated = [...comments];
      updated[index] = comment;
      await writeCollection("feed-comments.json", updated);
      return comment;
    });
  }

  /**
   * Removes a comment.
   *
   * @param id - Stable identifier of the comment to remove.
   * @returns Whether a comment was removed.
   */
  delete(id: string): Promise<boolean> {
    return withWriteLock(async () => {
      const comments = await this.findAll();
      const updated = comments.filter((comment) => comment.id !== id);
      if (updated.length === comments.length) return false;
      await writeCollection("feed-comments.json", updated);
      return true;
    });
  }
}
