/** Allowed categories for a feed post. */
export type PostType =
  | "food"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "announcement";

/** Cloudinary metadata persisted for a feed image. */
export type FeedMedia = {
  id: string;
  publicId: string;
  assetId: string;
  resourceType: "image";
  deliveryType: "authenticated";
  format: "jpg" | "jpeg" | "png" | "webp";
  width: number;
  height: number;
  bytes: number;
  originalName: string;
  alt: string | null;
  url?: string;
};

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
  authorId: string;
  subject: string;
  initial?: string;
  time: string;
  dateTime: string;
  createdAt: string;
  updatedAt: string;
  authorLabel?: string;
  recipient: string;
  body: string;
  reactions: number;
  comments: number;
  hasMedia?: boolean;
  mediaLabel?: string;
  media: FeedMedia[];
  kidId: string | null;
  roomId: string | null;
};
