"use client";

import { SearchField } from "@/app/components/ui";
import { normalizeName } from "@/app/features/kids/utils";
import type { KidListItem } from "@/app/features/kids/types";
import { KidCard } from "./kid-card";
import { KidsEmptyState } from "./kids-empty-state";
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
        <div className={styles.grid}>
          {filteredItems.map((item) => <KidCard key={item.slug} kid={item} />)}
        </div>
      ) : (
        <KidsEmptyState />
      )}
    </div>
  );
}
