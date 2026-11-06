import "server-only";

import type {
  FamilyFeedQueryDependencies,
} from "@/application/family/feed";
import { createPostgresFamilyFeedComposition } from "./family-feed-composition-postgres";
import {
  getPostgresRuntimeClient,
} from "../postgres-runtime";
import type { CurrentDaycareReader } from "@/application/daycare/ports";

/** Concrete server-only dependencies required by Family Feed queries. */
export type FamilyFeedComposition = FamilyFeedQueryDependencies;

/**
 * Creates persistence and media adapters for Family Feed application queries.
 *
 * @returns Concrete server-only adapters for Family Feed reads.
 */
export function createFamilyFeedComposition(daycareId?: string): FamilyFeedComposition {
  const currentDaycare: CurrentDaycareReader = daycareId
    ? { getCurrentDaycareId: async () => daycareId }
    : {
        getCurrentDaycareId: async () =>
          (await import("../postgres-runtime")).getPostgresRuntimeDaycare().getCurrentDaycareId(),
      };
  return createPostgresFamilyFeedComposition(
    getPostgresRuntimeClient(),
    currentDaycare,
  );
}
