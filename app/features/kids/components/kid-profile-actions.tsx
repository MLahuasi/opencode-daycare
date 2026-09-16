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
        <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        Resumen del día
      </Button>
    </aside>
  );
}
