import type { KidListItem } from "@/application/kid";
import { getAvatarToneByPosition } from "@/presentation/ui";
import { KidCard } from "./kid-card";
import styles from "./kids-list.module.css";

type VisibleKid = {
  item: KidListItem;
  position: number;
};

type KidsRoomGroupProps = {
  items: readonly VisibleKid[];
  room: string;
};

/**
 * Renders a room heading and the cards belonging to that room.
 *
 * @param props - Room grouping options.
 * @param props.items - Visible list items with their global positions.
 * @param props.room - Display name of the room.
 * @returns A room section containing its kid cards.
 */
export function KidsRoomGroup({ items, room }: KidsRoomGroupProps) {
  return (
    <section aria-labelledby={`room-${room}`} className={styles.roomSection}>
      <div className={styles.roomHeading}>
        <h2 id={`room-${room}`}>{room}</h2>
        <span>{items.length} niños</span>
        <i aria-hidden="true" />
      </div>
      <div className={styles.grid}>
        {items.map(({ item, position }) => (
          <KidCard
            key={item.slug}
            kid={item}
            tone={getAvatarToneByPosition(position)}
          />
        ))}
      </div>
    </section>
  );
}
