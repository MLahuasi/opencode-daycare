export type PostType = "achievement" | "activity" | "announcement";

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
};
