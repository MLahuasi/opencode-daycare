import type {
  FeedComment,
  FeedPost,
  FeedReaction,
} from "@/app/features/feed";
import type { Person, PersonRole } from "@/app/features/people";

/** A comment enriched with its valid author and localized timestamp. */
export type PostDetailComment = FeedComment & {
  author: Person;
  timeLabel: string;
};

/** A reaction enriched with its valid author. */
export type PostDetailReaction = FeedReaction & {
  person: Person;
};

/** Authorized read-only projection rendered by the post detail screen. */
export type PostDetail = {
  author: Person;
  authorRoleLabel: string;
  comments: readonly PostDetailComment[];
  createdAtLabel: string;
  post: FeedPost;
  reactions: readonly PostDetailReaction[];
  recipient: {
    id: string;
    label: string;
    kind: "kid" | "room";
  };
  viewerRole: PersonRole;
};
