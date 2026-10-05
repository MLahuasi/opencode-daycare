import type { PostComment } from "@/domain/post";

/** Persistence operations required by Post comment commands. */
export interface PostCommentRepository {
  /**
   * Lists all persisted comments.
   *
   * @returns All persisted Post comments.
   */
  findAll(): Promise<readonly PostComment[]>;
  /**
   * Finds one comment by stable identifier.
   *
   * @param id - Stable identifier of the comment.
   * @returns The matching comment, or null when it does not exist.
   */
  findById(id: string): Promise<PostComment | null>;
  /**
   * Appends a comment.
   *
   * @param comment - Comment record to persist.
   * @returns A promise that resolves after persistence completes.
   */
  create(comment: PostComment): Promise<void>;
  /**
   * Replaces a comment.
   *
   * @param comment - Updated comment record.
   * @returns The updated comment, or null when it does not exist.
   */
  update(comment: PostComment): Promise<PostComment | null>;
  /**
   * Removes a comment by stable identifier.
   *
   * @param id - Stable identifier of the comment to remove.
   * @returns Whether a comment was removed.
   */
  delete(id: string): Promise<boolean>;
}
