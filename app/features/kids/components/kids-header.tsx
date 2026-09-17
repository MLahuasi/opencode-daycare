import { Button } from "@/app/components/ui";
import styles from "./kids-list.module.css";

/**
 * Renders the Kids page heading and its presentational add action.
 *
 * @returns The Kids page header.
 */
export function KidsHeader() {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Gestión</p>
        <h1>Niños</h1>
      </div>
      <Button className={styles.addButton} variant="coral">
        <span aria-hidden="true">+</span>
        Agregar niño
      </Button>
    </header>
  );
}
