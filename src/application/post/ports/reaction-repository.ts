import type { PostReaction } from "@/domain/post";

/** Persistence operations required by Post reaction commands. */
export interface PostReactionRepository {
  /**
   * Lists all persisted reactions.
   *
   * @returns All persisted Post reactions.
   */
  findAll(): Promise<readonly PostReaction[]>;
  /**
   * Appends a reaction.
   *
   * @param reaction - Reaction record to persist.
   * @returns A promise that resolves after persistence completes.
   */
  create(reaction: PostReaction): Promise<void>;
  /**
   * Removes a reaction by stable identifier.
   *
   * @param id - Stable identifier of the reaction to remove.
   * @returns Whether a reaction was removed.
   */
  delete(id: string): Promise<boolean>;
}
