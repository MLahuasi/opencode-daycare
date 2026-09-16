import { Button } from "@/app/components/ui";
import styles from "./kids-list.module.css";

type KidsHeaderProps = {
  room: string;
  totalCount: number;
};

/**
 * Renders the Kids page heading and its presentational add action.
 *
 * @param props - Header content options.
 * @param props.room - Room represented by the current list.
 * @param props.totalCount - Number of kids represented by the current list.
 * @returns The Kids page header.
 */
export function KidsHeader({ room, totalCount }: KidsHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Gestión</p>
        <h1>Niños</h1>
        <p className={styles.headerSummary}>{totalCount} niños en {room}</p>
      </div>
      <Button className={styles.addButton} variant="coral">
        <span aria-hidden="true">+</span>
        Agregar niño
      </Button>
    </header>
  );
}
