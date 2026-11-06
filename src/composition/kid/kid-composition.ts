import "server-only";

import type {
  KidRepository as KidRepositoryPort,
  ParentKidRepository as ParentKidRepositoryPort,
  PersonRepository as PersonRepositoryPort,
  RoomRepository as RoomRepositoryPort,
} from "@/application/kid/ports";
import type { CurrentDaycareReader } from "@/application/daycare/ports";
import {
  PostgresKidRepository,
  PostgresParentKidRepository,
  PostgresPersonRepository,
  PostgresRoomRepository,
} from "@/infrastructure/persistence/postgres";
import { getPostgresRuntimeClient, getPostgresRuntimeDaycare } from "../postgres-runtime";

/** Server-side dependencies required by Kid application use cases. */
export type KidComposition = {
  kids: KidRepositoryPort;
  people: PersonRepositoryPort;
  rooms: RoomRepositoryPort;
  parentKids: ParentKidRepositoryPort;
};

/**
 * Creates the concrete server-side adapters for Kid use cases.
 *
 * @returns The persistence dependencies required by the Kid application layer.
 */
export function createKidComposition(daycareId?: string): KidComposition {
  const currentDaycare: CurrentDaycareReader = daycareId
    ? { getCurrentDaycareId: async () => daycareId }
    : getPostgresRuntimeDaycare();
  const client = getPostgresRuntimeClient();
  const kids = new PostgresKidRepository(client);
  const people = new PostgresPersonRepository(client);
  const rooms = new PostgresRoomRepository(client);
  const parentKids = new PostgresParentKidRepository(client);

  return {
    kids: {
      findAll: async () => kids.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => kids.findById(await currentDaycare.getCurrentDaycareId(), id),
      findBySlug: async (slug) => kids.findBySlug(await currentDaycare.getCurrentDaycareId(), slug),
      create: (kid) => kids.create(kid),
      update: (kid) => kids.update(kid),
    },
    people: {
      findAll: async () => people.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => people.findById(await currentDaycare.getCurrentDaycareId(), id),
      create: (person) => people.create(person),
      update: (person) => people.update(person),
    },
    rooms: {
      findAll: async () => rooms.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => rooms.findById(await currentDaycare.getCurrentDaycareId(), id),
      create: (room) => rooms.create(room),
      update: (room) => rooms.update(room),
    },
    parentKids: {
      findAll: async () => parentKids.findAll(await currentDaycare.getCurrentDaycareId()),
      findById: async (id) => parentKids.findById(await currentDaycare.getCurrentDaycareId(), id),
      findByKidId: async (id) => parentKids.findByKidId(await currentDaycare.getCurrentDaycareId(), id),
      create: (relationship) => parentKids.create(relationship),
      update: (relationship) => parentKids.update(relationship),
    },
  };
}
