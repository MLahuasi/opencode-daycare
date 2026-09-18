import { LinkButton } from "@/app/components/ui";
import styles from "./kids-list.module.css";

type KidsHeaderProps = {
  addHref: string;
};

/**
 * Renders the Kids page heading and its Add navigation.
 *
 * @param props - Kids header navigation options.
 * @param props.addHref - Destination for creating a kid.
 * @returns The Kids page header.
 */
export function KidsHeader({ addHref }: KidsHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Gestión</p>
        <h1>Niños</h1>
      </div>
      <LinkButton className={styles.addButton} href={addHref} variant="coral">
        <span aria-hidden="true">+</span>
        Agregar niño
      </LinkButton>
    </header>
  );
}
