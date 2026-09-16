import { Button } from "@/app/components/ui";
import styles from "./kid-profile.module.css";

/**
 * Renders presentational profile actions without navigation or business handlers.
 *
 * @returns The profile action controls.
 */
export function KidProfileActions() {
  return (
    <aside className={styles.actions} aria-label="Acciones del perfil">
      <Button className={styles.summaryButton} variant="soft">
        <span aria-hidden="true">*</span>
        Resumen del día
      </Button>
    </aside>
  );
}
