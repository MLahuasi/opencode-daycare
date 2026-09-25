/** A persisted read-only reaction attached to a feed post. */
export type FeedReaction = {
  id: string;
  postId: string;
  personId: string;
  type: "love";
  createdAt: string;
};
