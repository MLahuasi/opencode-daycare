import "server-only";

import type { PostRepository as PostRepositoryPort } from "@/src/application/post/ports";
import type { Post, PersistedPost } from "@/src/domain/post";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

const EMPTY_ENGAGEMENT = {
  reactionCount: 0,
  commentCount: 0,
  viewerHasLoved: false,
};

/** JSON-backed persistence adapter for Posts. */
export class PostRepository implements PostRepositoryPort {
  /**
   * Lists all persisted Posts.
   *
   * @returns All Post records from JSON persistence.
   */
  findAll(): Promise<readonly PersistedPost[]> {
    return readCollection<PersistedPost>("feed.json");
  }

  /**
   * Finds one Post by stable identifier.
   *
   * @param id - Stable identifier of the Post.
   * @returns The matching Post, or null when it does not exist.
   */
  async findById(id: string): Promise<PersistedPost | null> {
    const posts = await this.findAll();
    return posts.find((post) => post.id === id) ?? null;
  }

  /**
   * Appends a Post and returns its initial projection.
   *
   * @param post - Post record to persist.
   * @returns The persisted Post with initial engagement values.
   */
  create(post: PersistedPost): Promise<Post> {
    return withWriteLock(async () => {
      const posts = await this.findAll();
      await writeCollection("feed.json", [...posts, post]);
      return { ...post, engagement: { ...EMPTY_ENGAGEMENT } };
    });
  }

  /**
   * Replaces a Post and returns its initial projection.
   *
   * @param post - Updated Post record.
   * @returns The updated Post, or null when it does not exist.
   */
  update(post: PersistedPost): Promise<Post | null> {
    return withWriteLock(async () => {
      const posts = await this.findAll();
      const index = posts.findIndex((candidate) => candidate.id === post.id);
      if (index === -1) return null;

      const updated = [...posts];
      updated[index] = post;
      await writeCollection("feed.json", updated);
      return { ...post, engagement: { ...EMPTY_ENGAGEMENT } };
    });
  }
}
