"use client";

import { SearchField } from "@/app/components/ui";
import { normalizeName } from "@/app/features/kids/utils";
import type { KidListItem } from "@/app/features/kids/types";
import { KidsEmptyState } from "./kids-empty-state";
import { KidsRoomGroup } from "./kids-room-group";
import styles from "./kids-list.module.css";
import { useState } from "react";

type KidsFilterProps = {
  items: readonly KidListItem[];
};

/**
 * Filters the projected kid list locally without importing fixture data.
 *
 * @param props - Filter input.
 * @param props.items - Safe list DTOs provided by the server.
 * @returns The searchable Kids list.
 */
export function KidsFilter({ items }: KidsFilterProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeName(query.trim());
  const filteredItems = normalizedQuery
    ? items.filter((item) => normalizeName(item.name).includes(normalizedQuery))
    : items;
  const itemsByRoom = new Map<string, KidListItem[]>();

  for (const item of filteredItems) {
    const roomItems = itemsByRoom.get(item.room);

    if (roomItems) {
      roomItems.push(item);
    } else {
      itemsByRoom.set(item.room, [item]);
    }
  }

  return (
    <div className={styles.filter}>
      <SearchField
        className={styles.search}
        label="Buscar niño"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar niño..."
        value={query}
      />
      {filteredItems.length > 0 ? (
        Array.from(itemsByRoom, ([room, roomItems]) => (
          <KidsRoomGroup key={room} kids={roomItems} room={room} />
        ))
      ) : (
        <KidsEmptyState />
      )}
    </div>
  );
}
