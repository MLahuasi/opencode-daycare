import "server-only";

import type { PostDependencies } from "@/application/post";
import { createCloudinaryImageStorage } from "@/infrastructure/adapters/cloudinary";
import { createPostgresPostComposition } from "./postgres-composition";
import {
  getPostgresRuntimeClient,
} from "../postgres-runtime";
import type { CurrentDaycareReader } from "@/application/daycare/ports";

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
export function createPostComposition(daycareId?: string): PostComposition {
  const currentDaycare: CurrentDaycareReader = daycareId
    ? { getCurrentDaycareId: async () => daycareId }
    : {
        getCurrentDaycareId: async () =>
          (await import("../postgres-runtime")).getPostgresRuntimeDaycare().getCurrentDaycareId(),
      };
  return createPostgresPostComposition(
    getPostgresRuntimeClient(),
    currentDaycare,
  );
}
