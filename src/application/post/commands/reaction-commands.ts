import type { PostReaction } from "@/domain/post";
import type { ToggleReactionResult } from "../dto";

/**
 * Toggles one love reaction in memory.
 *
 * @param reactions - Current reaction collection.
 * @param postId - Post identifier to toggle.
 * @param personId - Requesting person's identifier.
 * @param id - Identifier for a newly created reaction.
 * @param timestamp - Creation timestamp for a newly created reaction.
 * @returns The updated collection and resulting active state.
 */
export function toggleReactionRecord(
  reactions: readonly PostReaction[],
  postId: string,
  personId: string,
  id: string,
  timestamp: string,
): ToggleReactionResult {
  const existing = reactions.find(
    (reaction) =>
      reaction.postId === postId &&
      reaction.personId === personId &&
      reaction.type === "love",
  );

  if (existing) {
    return {
      active: false,
      reactions: reactions.filter((reaction) => reaction.id !== existing.id),
    };
  }

  const reaction: PostReaction = {
    id,
    postId,
    personId,
    type: "love",
    createdAt: timestamp,
  };

  return { active: true, reactions: [...reactions, reaction] };
}
