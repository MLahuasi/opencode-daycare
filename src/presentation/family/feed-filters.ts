import type { FamilyFeedFilter } from "@/src/domain/family";
import type { Kid } from "@/src/domain/kid";
import type { Room } from "@/src/domain/room";

/** A visual option rendered in the family feed filter navigation. */
export type FamilyFeedOption = {
  filter: FamilyFeedFilter;
  id: string;
  label: string;
};

/**
 * Creates localized labels for the filters authorized in a family feed.
 *
 * @param activeKids - Active children visible to the current family.
 * @param rooms - Rooms authorized for the current family.
 * @returns Ordered visual filter options for the family feed navigation.
 */
export function presentFamilyFeedOptions(
  activeKids: readonly Kid[],
  rooms: readonly Room[],
): readonly FamilyFeedOption[] {
  const activeRoomIds = new Set(activeKids.map((kid) => kid.roomId));
  const activeRooms = rooms.filter((room) => activeRoomIds.has(room.id));
  const options: FamilyFeedOption[] = activeKids.map((kid) => ({
    filter: { kind: "kid", id: kid.id },
    id: kid.id,
    label: kid.name,
  }));

  options.push(
    ...activeRooms.map((room) => ({
      filter: { kind: "room", id: room.id } as const,
      id: room.id,
      label: room.name,
    })),
  );

  if (activeRooms.length > 1) {
    options.push({ filter: { kind: "all" }, id: "all", label: "Todos" });
  }

  return options;
}
