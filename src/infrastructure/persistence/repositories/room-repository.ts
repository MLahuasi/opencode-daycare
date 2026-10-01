import "server-only";

import type { RoomRepository as RoomRepositoryPort } from "@/src/application/kid/ports";
import type { Room } from "@/src/domain/room";
import {
  readCollection,
  withWriteLock,
  writeCollection,
} from "@/src/infrastructure/persistence";

/** JSON-backed persistence adapter for Rooms. */
export class RoomRepository implements RoomRepositoryPort {
  /**
   * Lists all persisted rooms.
   *
   * @returns All room records from JSON persistence.
   */
  findAll(): Promise<readonly Room[]> {
    return readCollection<Room>("rooms.json");
  }

  /**
   * Finds a room by stable identifier.
   *
   * @param id - Stable room identifier.
   * @returns The room or `null` when it does not exist.
   */
  async findById(id: string): Promise<Room | null> {
    const rooms = await this.findAll();

    return rooms.find((room) => room.id === id) ?? null;
  }

  /**
   * Persists a new room.
   *
   * @param room - Room record to append.
   * @returns A promise that resolves after persistence completes.
   */
  create(room: Room): Promise<void> {
    return withWriteLock(async () => {
      const rooms = await this.findAll();

      await writeCollection("rooms.json", [...rooms, room]);
    });
  }

  /**
   * Replaces an existing room.
   *
   * @param room - Updated room record.
   * @returns A promise that resolves after persistence completes.
   */
  update(room: Room): Promise<void> {
    return withWriteLock(async () => {
      const rooms = await this.findAll();
      const index = rooms.findIndex((candidate) => candidate.id === room.id);

      if (index === -1) {
        throw new Error(`Cannot update missing room: ${room.id}`);
      }

      const updatedRooms = [...rooms];
      updatedRooms[index] = room;
      await writeCollection("rooms.json", updatedRooms);
    });
  }
}
