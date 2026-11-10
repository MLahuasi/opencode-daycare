import "server-only";

import { randomUUID } from "node:crypto";

import type { CurrentDaycareReader } from "@/application/daycare/ports";
import type { PostDependencies } from "@/application/post";
import { PostAuthorizationPolicy } from "@/application/post";
import { createCloudinaryImageStorage } from "@/infrastructure/adapters/cloudinary";
import type { PostgresQueryClient } from "@/infrastructure/persistence/postgres";
import {
  PostgresKidRepository,
  PostgresParentKidRepository,
  PostgresPersonRepository,
  PostgresPostAccessRepository,
  PostgresPostCommentRepository,
  PostgresPostReactionRepository,
  PostgresPostRepository,
  PostgresRoomRepository,
} from "@/infrastructure/persistence/postgres";

/** PostgreSQL-only Post composition for `(general)` route verification. */
export function createPostgresPostComposition(
  client: PostgresQueryClient,
  currentDaycare: CurrentDaycareReader,
): PostDependencies {
  const peopleRepository = new PostgresPersonRepository(client);
  const parentKidsRepository = new PostgresParentKidRepository(client);
  const kidsRepository = new PostgresKidRepository(client);
  const roomsRepository = new PostgresRoomRepository(client);
  const access = new PostgresPostAccessRepository(client, currentDaycare);

  return {
    authorizationAccess: access,
    people: {
      findAll: async () => peopleRepository.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => peopleRepository.findById(await currentDaycare.getCurrentDaycareId(), id),
      create: (person) => peopleRepository.create(person),
      update: (person) => peopleRepository.update(person),
    },
    parentKids: {
      findAll: async () => parentKidsRepository.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => parentKidsRepository.findById(await currentDaycare.getCurrentDaycareId(), id),
      findByKidId: async (kidId) => parentKidsRepository.findByKidId(await currentDaycare.getCurrentDaycareId(), kidId),
      create: (relationship) => parentKidsRepository.create(relationship),
      update: (relationship) => parentKidsRepository.update(relationship),
    },
    kids: {
      findAll: async () => kidsRepository.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => kidsRepository.findById(await currentDaycare.getCurrentDaycareId(), id),
      findBySlug: async (slug) => kidsRepository.findBySlug(await currentDaycare.getCurrentDaycareId(), slug),
      findAllInRooms: async (roomIds) => kidsRepository.findAllInRooms(await currentDaycare.getCurrentDaycareId(), roomIds),
      findByIdInRooms: async (id, roomIds) => kidsRepository.findByIdInRooms(await currentDaycare.getCurrentDaycareId(), id, roomIds),
      findBySlugInRooms: async (slug, roomIds) => kidsRepository.findBySlugInRooms(await currentDaycare.getCurrentDaycareId(), slug, roomIds),
      create: (kid) => kidsRepository.create(kid),
      update: (kid) => kidsRepository.update(kid),
    },
    rooms: {
      findAll: async () => roomsRepository.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => roomsRepository.findById(await currentDaycare.getCurrentDaycareId(), id),
      create: (room) => roomsRepository.create(room),
      update: (room) => roomsRepository.update(room),
    },
    posts: new PostgresPostRepository(client, currentDaycare, access),
    comments: new PostgresPostCommentRepository(client, currentDaycare),
    reactions: new PostgresPostReactionRepository(client, currentDaycare),
    imageStorage: createCloudinaryImageStorage(),
    authorization: new PostAuthorizationPolicy(access),
    identifiers: { create: () => randomUUID() },
    clock: { now: () => new Date() },
  };
}
