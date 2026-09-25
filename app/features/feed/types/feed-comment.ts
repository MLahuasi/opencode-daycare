/** A persisted read-only comment attached to a feed post. */
export type FeedComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
};
