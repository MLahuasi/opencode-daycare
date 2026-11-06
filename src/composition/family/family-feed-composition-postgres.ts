import "server-only";

import type { FamilyFeedQueryDependencies } from "@/application/family/feed";
import type { CurrentDaycareReader } from "@/application/daycare/ports";
import { derivePostEngagement, hasSinglePostDestination, type Post } from "@/domain/post";
import { createCloudinaryImageStorage } from "@/infrastructure/adapters/cloudinary";
import type { PostgresQueryClient } from "@/infrastructure/persistence/postgres";
import {
  PostgresKidRepository,
  PostgresParentKidRepository,
  PostgresPersonRepository,
  PostgresPostCommentRepository,
  PostgresPostReactionRepository,
  PostgresPostRepository,
  PostgresRoomRepository,
} from "@/infrastructure/persistence/postgres";

/** PostgreSQL-only Family Feed composition for the General runtime routes. */
export function createPostgresFamilyFeedComposition(
  client: PostgresQueryClient,
  currentDaycare: CurrentDaycareReader,
): FamilyFeedQueryDependencies {
  const people = new PostgresPersonRepository(client);
  const parentKids = new PostgresParentKidRepository(client);
  const kids = new PostgresKidRepository(client);
  const rooms = new PostgresRoomRepository(client);
  const posts = new PostgresPostRepository(client, currentDaycare);
  const comments = new PostgresPostCommentRepository(client, currentDaycare);
  const reactions = new PostgresPostReactionRepository(client, currentDaycare);

  const daycareId = () => currentDaycare.getCurrentDaycareId();

  return {
    directory: {
      findKids: async () => kids.findAll(await daycareId()),
      findRooms: async () => rooms.findAll(await daycareId()),
    },
    media: {
      resolve: async (feedPosts) => {
        if (!feedPosts.some((post) => post.media.length > 0)) return feedPosts;
        const storage = createCloudinaryImageStorage();
        return feedPosts.map((post) => ({
          ...post,
          media: post.media.map((media) => ({ ...media, url: storage.getUrl(media) })),
        }));
      },
    },
    parentKids: {
      findByParentId: async (parentId) =>
        parentKids.findByParentId(await daycareId(), parentId),
    },
    people: {
      findById: async (id) => people.findById(await daycareId(), id),
    },
    posts: {
      findForViewer: async (viewerId): Promise<readonly Post[]> => {
        const persistedPosts = await posts.findAll();
        const postIds = persistedPosts.map((post) => post.id);
        const [persistedComments, persistedReactions, allKids, allRooms] =
          await Promise.all([
            comments.findByPostIds(postIds),
            reactions.findByPostIds(postIds),
            kids.findAll(await daycareId()),
            rooms.findAll(await daycareId()),
          ]);
        const kidsById = new Map(allKids.map((kid) => [kid.id, kid]));
        const roomsById = new Map(allRooms.map((room) => [room.id, room]));

        return persistedPosts.map((post) => {
          if (!hasSinglePostDestination(post)) {
            throw new Error(`Feed post ${post.id} must have exactly one destination.`);
          }
          return {
            ...post,
            subject:
              post.kidIds.length > 1
                ? "Varios niños"
                : post.kidIds.length === 1
                  ? (kidsById.get(post.kidIds[0])?.name ?? "Varios niños")
                  : (roomsById.get(post.roomId ?? "")?.name ?? "Anuncio general"),
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
