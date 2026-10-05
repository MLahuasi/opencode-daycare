import type { Post, PersistedPost } from "@/domain/post";

/** Persistence operations required by Post commands and queries. */
export interface PostRepository {
  /**
   * Lists all persisted Posts.
   *
   * @returns All persisted Post records.
   */
  findAll(): Promise<readonly PersistedPost[]>;
  /**
   * Finds one Post by stable identifier.
   *
   * @param id - Stable identifier of the Post.
   * @returns The matching Post, or null when it does not exist.
   */
  findById(id: string): Promise<PersistedPost | null>;
  /**
   * Appends a new Post.
   *
   * @param post - Post record to persist.
   * @returns The persisted Post with initial engagement values.
   */
  create(post: PersistedPost): Promise<Post>;
  /**
   * Replaces an existing Post.
   *
   * @param post - Updated Post record.
   * @returns The updated Post, or null when it does not exist.
   */
  update(post: PersistedPost): Promise<Post | null>;
}
