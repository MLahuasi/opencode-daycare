import "server-only";

import { randomUUID } from "node:crypto";
import {
  readCollection,
  withJsonTransaction,
  writeCollection,
} from "@/src/infrastructure/persistence";
import type { FeedReaction } from "../types";

/**
 * Adds or removes one love reaction for a person and post atomically.
 *
 * @param postId - Stable identifier of the post being toggled.
 * @param personId - Authenticated person's identifier.
 * @returns The created reaction, or null when an existing reaction was removed.
 */
export function toggleFeedReaction(
  postId: string,
  personId: string,
): Promise<FeedReaction | null> {
  return withJsonTransaction(["feed-reactions.json"], async () => {
    const reactions = await readCollection<FeedReaction>("feed-reactions.json");
    const hasExistingReaction = reactions.some(
      (reaction) =>
        reaction.postId === postId &&
        reaction.personId === personId &&
        reaction.type === "love",
    );

    if (hasExistingReaction) {
      const updatedReactions = reactions.filter(
        (reaction) =>
          reaction.postId !== postId ||
          reaction.personId !== personId ||
          reaction.type !== "love",
      );
      await writeCollection("feed-reactions.json", updatedReactions);
      return null;
    }

    const reaction: FeedReaction = {
      id: randomUUID(),
      postId,
      personId,
      type: "love",
      createdAt: new Date().toISOString(),
    };
    await writeCollection("feed-reactions.json", [...reactions, reaction]);
    return reaction;
  });
}
