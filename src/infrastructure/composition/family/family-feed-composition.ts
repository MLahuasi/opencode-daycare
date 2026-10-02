import "server-only";

import type {
  FamilyFeedQueryDependencies,
} from "@/src/application/family/feed";
import { getFeeds, resolveFeedMediaUrls } from "@/app/features/feed/server";
import {
  KidRepository,
  ParentKidRepository,
  PersonRepository,
  RoomRepository,
} from "@/src/infrastructure/persistence/repositories";

/** Concrete server-only dependencies required by Family Feed queries. */
export type FamilyFeedComposition = FamilyFeedQueryDependencies;

/**
 * Creates persistence and media adapters for Family Feed application queries.
 *
 * @returns Concrete server-only adapters for Family Feed reads.
 */
export function createFamilyFeedComposition(): FamilyFeedComposition {
  const people = new PersonRepository();
  const parentKids = new ParentKidRepository();
  const kids = new KidRepository();
  const rooms = new RoomRepository();

  return {
    directory: {
      findKids: () => kids.findAll(),
      findRooms: () => rooms.findAll(),
    },
    media: {
      resolve: (posts) => Promise.resolve(resolveFeedMediaUrls(posts)),
    },
    parentKids: {
      findByParentId: async (parentId) =>
        (await parentKids.findAll()).filter(
          (parentKid) => parentKid.parentId === parentId,
        ),
    },
    people,
    posts: {
      findForViewer: (viewerId) => getFeeds({ resolveMediaUrls: false, viewerId }),
    },
  };
}
