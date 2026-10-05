import type { Kid } from "@/src/domain/kid";
import type {
  Post,
  PostComment,
  PostMedia,
  PostReaction,
  PersistedPost,
  PostType,
} from "@/src/domain/post";
import type { Person, PersonRole } from "@/src/domain/person";
import type { Room } from "@/src/domain/room";

/** Values required to create a Post. */
export type CreatePostInput = {
  authorId: string;
  body: string;
  kidId: string | null;
  media: PostMedia[];
  roomId: string | null;
  subject: string;
  type: PostType;
};

/** Values required to update a Post. */
export type UpdatePostInput = Omit<CreatePostInput, "authorId"> & {
  authorId: string;
};

/** Values required to create a comment. */
export type CreateCommentInput = {
  authorId: string;
  body: string;
  postId: string;
};

/** Values required to update a comment. */
export type UpdateCommentInput = {
  authorId: string;
  body: string;
  commentId: string;
};

/** Data required to project an authorized Post detail. */
export type PostDetailProjectionInput = {
  author: Person;
  comments: readonly PostComment[];
  people: readonly Person[];
  post: Post;
  reactions: readonly PostReaction[];
  recipientKid: Kid | null;
  recipientRoom: Room | null;
  viewerRole: PersonRole;
};

/** Comment enriched with its persisted author for neutral Post projections. */
export type PostDetailComment = PostComment & {
  author: Person;
};

/** Reaction enriched with its persisted author for neutral Post projections. */
export type PostDetailReaction = PostReaction & {
  person: Person;
};

/** Authorized Post projection before visual formatting. */
export type PostDetail = {
  author: Person;
  comments: readonly PostDetailComment[];
  post: Post;
  reactions: readonly PostDetailReaction[];
  recipient: {
    id: string;
    kind: "kid" | "room";
    name: string;
  };
  viewerRole: PersonRole;
};

/** Result returned when toggling a reaction in memory. */
export type ToggleReactionResult = {
  active: boolean;
  reactions: readonly PostReaction[];
};

/** Persisted Post record produced by a create or update command. */
export type PostRecord = PersistedPost;
