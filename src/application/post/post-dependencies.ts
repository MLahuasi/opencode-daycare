import type {
  PostAuthorization,
  PostClock,
  PostCommentRepository,
  PostIdentifierGenerator,
  PostImageStorage,
  PostReactionRepository,
  PostRepository,
} from "./ports";

/** Persistence, authorization and provider capabilities required by Post. */
export type PostDependencies = {
  posts: PostRepository;
  comments: PostCommentRepository;
  reactions: PostReactionRepository;
  imageStorage: PostImageStorage;
  authorization: PostAuthorization;
  identifiers: PostIdentifierGenerator;
  clock: PostClock;
};
