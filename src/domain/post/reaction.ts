/** Supported reaction types for a Post. */
export type PostReactionType = "love";

/** Persisted reaction attached to a Post. */
export type PostReaction = {
  id: string;
  postId: string;
  personId: string;
  type: PostReactionType;
  createdAt: string;
};

/**
 * Checks whether a reaction belongs to a person.
 *
 * @param reaction - Reaction to inspect.
 * @param personId - Person requesting the operation.
 * @returns Whether the person created the reaction.
 */
export function isReactionByPerson(
  reaction: PostReaction,
  personId: string,
): boolean {
  return reaction.personId === personId;
}
