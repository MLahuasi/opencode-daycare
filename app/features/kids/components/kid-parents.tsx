import { Avatar, Badge, Button } from "@/app/components/ui";
import type { Parent, ParentRelationship, ParentStatus } from "@/app/features/kids/types";
import styles from "./kid-profile.module.css";

const relationshipLabels: Record<ParentRelationship, string> = {
  father: "Papá",
  guardian: "Representante",
  mother: "Mamá",
};

const statusLabels: Record<ParentStatus, string> = {
  active: "Activa",
  inactive: "Inactiva",
  pending: "Pendiente",
};

const statusVariants: Record<ParentStatus, "green" | "neutral" | "yellow"> = {
  active: "green",
  inactive: "neutral",
  pending: "yellow",
};

type KidParentsProps = {
  parents: readonly Parent[];
};

/**
 * Renders the parents linked to a kid and a non-functional linking control.
 *
 * @param props - Linked parent options.
 * @param props.parents - Parent entities resolved by the server.
 * @returns The linked parents panel.
 */
export function KidParents({ parents }: KidParentsProps) {
  return (
    <section aria-labelledby="linked-parents-heading" className={styles.parentsPanel}>
      <h2 id="linked-parents-heading">Padres vinculados</h2>
      <div className={styles.parentsList}>
        {parents.map((parent) => (
          <div className={styles.parent} key={parent.id}>
            <Avatar aria-hidden="true" initial={parent.name.charAt(0).toUpperCase()} size="sm" tone="purple" />
            <div className={styles.parentDetails}>
              <strong>{parent.name}</strong>
              <span>{relationshipLabels[parent.relationship]}</span>
            </div>
            <Badge variant={statusVariants[parent.status]}>{statusLabels[parent.status]}</Badge>
          </div>
        ))}
        {parents.length === 0 ? (
          <p className={styles.noParents}>Todavía no hay padres vinculados.</p>
        ) : null}
        <Button className={styles.linkParentButton} variant="ghost">
          <span aria-hidden="true">+</span>
          Vincular otro padre
        </Button>
      </div>
    </section>
  );
}
