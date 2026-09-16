import type { KidListItem } from "@/app/features/kids/types";
import { KidCard } from "./kid-card";
import styles from "./kids-list.module.css";

type KidsRoomGroupProps = {
  kids: readonly KidListItem[];
  room: string;
};

/**
 * Renders a room heading and the cards belonging to that room.
 *
 * @param props - Room grouping options.
 * @param props.kids - Safe list DTOs to render in the room grid.
 * @param props.room - Display name of the room.
 * @returns A room section containing its kid cards.
 */
export function KidsRoomGroup({ kids, room }: KidsRoomGroupProps) {
  return (
    <section aria-labelledby={`room-${room}`} className={styles.roomSection}>
      <div className={styles.roomHeading}>
        <h2 id={`room-${room}`}>{room}</h2>
        <span>{kids.length} niños</span>
        <i aria-hidden="true" />
      </div>
      <div className={styles.grid}>
        {kids.map((kid) => <KidCard key={kid.slug} kid={kid} />)}
      </div>
    </section>
  );
}
