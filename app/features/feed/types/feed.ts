/** Allowed presentation categories for a feed post. */
export type PostType = "achievement" | "activity" | "announcement";

/** Static copy projected by the staff room header and composer. */
export type FeedOverview = {
  roomLabel: string;
  greeting: string;
  attendance: string;
  date: string;
  composerPrompt: string;
  publishedTodayLabel: string;
};

/** Persisted and projected content rendered by a feed post card. */
export type FeedPost = {
  id: string;
  type: PostType;
  subject: string;
  initial?: string;
  time: string;
  dateTime: string;
  authorLabel?: string;
  recipient: string;
  body: string;
  reactions: number;
  comments: number;
  hasMedia?: boolean;
  kidId: string | null;
  roomId: string | null;
};
