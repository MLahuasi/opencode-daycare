import type {
  KidRepository,
  ParentKidRepository,
  PersonRepository,
  RoomRepository,
} from "./ports";

/** Persistence dependencies required by Kid application use cases. */
export type KidDependencies = {
  kids: KidRepository;
  people: PersonRepository;
  rooms: RoomRepository;
  parentKids: ParentKidRepository;
};
