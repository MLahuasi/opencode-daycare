import type { Room } from "@/src/domain/room";

/** Persistence operations required to manage daycare rooms. */
export interface RoomRepository {
  /** Lists all rooms available for assignment. */
  findAll(): Promise<readonly Room[]>;

  /** Finds a room by its stable identifier. */
  findById(id: string): Promise<Room | null>;

  /** Persists a newly created room. */
  create(room: Room): Promise<void>;

  /** Replaces an existing room. */
  update(room: Room): Promise<void>;
}
