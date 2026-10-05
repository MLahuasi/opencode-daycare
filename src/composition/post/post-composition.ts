import "server-only";

import {
  PostAuthorizationPolicy,
  type PostDependencies,
} from "@/src/application/post";
import {
  KidRepository,
  PersonRepository,
  RoomRepository,
} from "@/src/infrastructure/persistence/repositories";
import {
  PostCommentRepository,
  JsonPostAccessRepository,
  PostReactionRepository,
  PostRepository,
} from "@/src/infrastructure/persistence/repositories";
import { createCloudinaryImageStorage } from "@/src/infrastructure/adapters/cloudinary";
import { randomUUID } from "node:crypto";

/** Concrete server-only dependencies required by Post use cases. */
export type PostComposition = PostDependencies;

/**
 * Creates the concrete media storage port used by Post entry points.
 *
 * @returns Cloudinary-backed image storage for Post media.
 */
export function createPostImageStorage() {
  return createCloudinaryImageStorage();
}

/**
 * Creates the concrete adapters for Post use cases.
 *
 * @returns Persistence, authorization and media capabilities for Post.
 */
export function createPostComposition(): PostComposition {
  const access = new JsonPostAccessRepository();

  return {
    authorizationAccess: access,
    people: new PersonRepository(),
    kids: new KidRepository(),
    rooms: new RoomRepository(),
    posts: new PostRepository(),
    comments: new PostCommentRepository(),
    reactions: new PostReactionRepository(),
    imageStorage: createPostImageStorage(),
    authorization: new PostAuthorizationPolicy(access),
    identifiers: {
      /** @returns A UUID identifier. */
      create: () => randomUUID(),
    },
    clock: {
      /** @returns The current instant. */
      now: () => new Date(),
    },
  };
}
