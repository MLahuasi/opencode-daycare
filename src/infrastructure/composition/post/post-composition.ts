import "server-only";

import {
  PostAuthorizationPolicy,
  type PostDependencies,
} from "@/src/application/post";
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
 * Creates the concrete adapters for Post use cases.
 *
 * @returns Persistence, authorization and media capabilities for Post.
 */
export function createPostComposition(): PostComposition {
  const access = new JsonPostAccessRepository();

  return {
    posts: new PostRepository(),
    comments: new PostCommentRepository(),
    reactions: new PostReactionRepository(),
    imageStorage: createCloudinaryImageStorage(),
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
