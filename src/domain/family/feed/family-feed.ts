/** A filter available in the family feed. */
export type FamilyFeedFilter =
  | { kind: "kid"; id: string }
  | { kind: "room"; id: string }
  | { kind: "all" };

/** Minimum post data required by family feed visibility rules. */
export type FamilyFeedPost = {
  id: string;
  kidId: string | null;
  roomId: string | null;
  createdAt: string;
};
