import "server-only";

import type { PostReactionRepository as PostReactionRepositoryPort } from "@/application/post/ports";
import type { PostReaction } from "@/domain/post";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/infrastructure/persistence";

/** JSON-backed persistence adapter for Post reactions. */
export class PostReactionRepository implements PostReactionRepositoryPort {
  /**
   * Lists all persisted reactions.
   *
   * @returns All Post reactions from JSON persistence.
   */
  findAll(): Promise<readonly PostReaction[]> {
    return readCollection<PostReaction>("feed-reactions.json");
  }

  /**
   * Appends a reaction.
   *
   * @param reaction - Reaction record to persist.
   * @returns A promise that resolves after persistence completes.
   */
  create(reaction: PostReaction): Promise<void> {
    return withWriteLock(async () => {
      const reactions = await this.findAll();
      await writeCollection("feed-reactions.json", [...reactions, reaction]);
    });
  }

  /**
   * Removes a reaction.
   *
   * @param id - Stable identifier of the reaction to remove.
   * @returns Whether a reaction was removed.
   */
  delete(id: string): Promise<boolean> {
    return withWriteLock(async () => {
      const reactions = await this.findAll();
      const updated = reactions.filter((reaction) => reaction.id !== id);
      if (updated.length === reactions.length) return false;
      await writeCollection("feed-reactions.json", updated);
      return true;
    });
  }
}
