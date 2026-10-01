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
  /** @inheritdoc */
  findAll(): Promise<readonly Room[]> {
    return readCollection<Room>("rooms.json");
  }

  /** @inheritdoc */
  async findById(id: string): Promise<Room | null> {
    const rooms = await this.findAll();

    return rooms.find((room) => room.id === id) ?? null;
  }

  /** @inheritdoc */
  create(room: Room): Promise<void> {
    return withWriteLock(async () => {
      const rooms = await this.findAll();

      await writeCollection("rooms.json", [...rooms, room]);
    });
  }

  /** @inheritdoc */
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
