import { Avatar } from "@/app/components/ui";
import { LogoutButton } from "@/app/components/layout";
import type { Kid } from "@/app/features/kids/types";
import type { Person } from "@/app/features/people";
import styles from "./family-header.module.css";

type FamilyHeaderProps = {
  className?: string;
  kids: readonly Kid[];
  person: Pick<Person, "name">;
};

/**
 * Renders the authenticated parent's identity, linked children, and logout.
 *
 * @param props - Family header configuration.
 * @param props.className - Optional classes applied to the header.
 * @param props.kids - Children linked to the authenticated parent.
 * @param props.person - Parent identity displayed in the header.
 * @returns The family account header.
 */
export function FamilyHeader({ className = "", kids, person }: FamilyHeaderProps) {
  const initial = person.name.trim().charAt(0).toUpperCase();

  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.identity}>
        <Avatar aria-hidden="true" initial={initial} size="lg" tone="blue" />
        <div>
          <p className={styles.eyebrow}>Espacio familiar</p>
          <h1>{person.name}</h1>
        </div>
      </div>

      <div className={styles.childrenSection}>
        <p className={styles.label}>Niños vinculados</p>
        {kids.length > 0 ? (
          <ul className={styles.childrenList}>
            {kids.map((kid) => (
              <li key={kid.id}>{kid.name}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyChildren}>Sin niños vinculados</p>
        )}
      </div>

      <LogoutButton label="Cerrar sesión" />
    </header>
  );
}
