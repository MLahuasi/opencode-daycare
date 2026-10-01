import "server-only";

import type {
  KidRepository as KidRepositoryPort,
  ParentKidRepository as ParentKidRepositoryPort,
  PersonRepository as PersonRepositoryPort,
  RoomRepository as RoomRepositoryPort,
} from "@/src/application/kid/ports";
import {
  KidRepository,
  ParentKidRepository,
  PersonRepository,
  RoomRepository,
} from "@/src/infrastructure/persistence/repositories";

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
export function createKidComposition(): KidComposition {
  return {
    kids: new KidRepository(),
    people: new PersonRepository(),
    rooms: new RoomRepository(),
    parentKids: new ParentKidRepository(),
  };
}
