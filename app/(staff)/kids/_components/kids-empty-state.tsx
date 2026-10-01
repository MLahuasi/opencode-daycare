import styles from "./kids-list.module.css";

/**
 * Renders the empty list state while preserving the surrounding search context.
 *
 * @returns An accessible no-results message.
 */
export function KidsEmptyState() {
  return (
    <div className={styles.emptyState} role="status">
      <p>No encontramos niños con esa búsqueda.</p>
      <span>Prueba con otro nombre.</span>
    </div>
  );
}
