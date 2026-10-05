import "server-only";

import type {
  FamilyFeedQueryDependencies,
} from "@/application/family/feed";
import { derivePostEngagement, hasSinglePostDestination } from "@/domain/post";
import type { Post } from "@/domain/post";
import { createCloudinaryImageStorage } from "@/infrastructure/adapters/cloudinary";
import {
  KidRepository,
  PostCommentRepository,
  PostReactionRepository,
  PostRepository,
  ParentKidRepository,
  PersonRepository,
  RoomRepository,
} from "@/infrastructure/persistence/repositories";

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
  const posts = new PostRepository();
  const comments = new PostCommentRepository();
  const reactions = new PostReactionRepository();

  return {
    directory: {
      findKids: () => kids.findAll(),
      findRooms: () => rooms.findAll(),
    },
    media: {
      resolve: async (feedPosts) => {
        if (!feedPosts.some((post) => post.media.length > 0)) {
          return feedPosts;
        }

        const imageStorage = createCloudinaryImageStorage();
        return feedPosts.map((post) => ({
          ...post,
          media: post.media.map((media) => ({
            ...media,
            url: imageStorage.getUrl(media),
          })),
        }));
      },
    },
    parentKids: {
      findByParentId: async (parentId) =>
        (await parentKids.findAll()).filter(
          (parentKid) => parentKid.parentId === parentId,
        ),
    },
    people,
    posts: {
      findForViewer: async (viewerId): Promise<readonly Post[]> => {
        const [persistedPosts, persistedComments, persistedReactions] =
          await Promise.all([
            posts.findAll(),
            comments.findAll(),
            reactions.findAll(),
          ]);

        return persistedPosts.map((post) => {
          if (!hasSinglePostDestination(post)) {
            throw new Error(
              `Feed post ${post.id} must have exactly one destination: kidId or roomId.`,
            );
          }

          return {
            ...post,
            engagement: derivePostEngagement(
              post.id,
              persistedComments,
              persistedReactions,
              viewerId,
            ),
          };
        });
      },
    },
  };
}
