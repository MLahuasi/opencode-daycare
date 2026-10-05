import type {
  PostAuthorization,
  PostAccessRepository,
  PostClock,
  PostCommentRepository,
  PostIdentifierGenerator,
  PostImageStorage,
  PostReactionRepository,
  PostRepository,
} from "./ports";
import type {
  KidRepository,
  PersonRepository,
  RoomRepository,
} from "@/src/application/kid/ports";

/** Persistence, authorization and provider capabilities required by Post. */
export type PostDependencies = {
  authorizationAccess: PostAccessRepository;
  people: PersonRepository;
  kids: KidRepository;
  rooms: RoomRepository;
  posts: PostRepository;
  comments: PostCommentRepository;
  reactions: PostReactionRepository;
  imageStorage: PostImageStorage;
  authorization: PostAuthorization;
  identifiers: PostIdentifierGenerator;
  clock: PostClock;
};
