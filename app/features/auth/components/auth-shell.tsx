import type { ReactNode } from "react";
import { Brand } from "@/app/components/ui";
import styles from "./auth.module.css";

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
};

/**
 * Renders the shared split layout for authentication screens.
 *
 * @param props - Authentication shell content.
 * @param props.children - Form content rendered in the right panel.
 * @param props.eyebrow - Optional supporting label in the brand panel.
 * @param props.title - Main title displayed in the brand panel.
 * @param props.description - Supporting copy displayed below the title.
 * @returns A responsive authentication layout.
 */
export function AuthShell({
  children,
  description,
  eyebrow = "Guardería Sala Soles",
  title,
}: AuthShellProps) {
  return (
    <div className={styles.shell}>
      <section aria-label="OpenDayCare" className={styles.brandPanel}>
        <div aria-hidden="true" className={styles.brandOrbTop} />
        <div aria-hidden="true" className={styles.brandOrbBottom} />
        <Brand
          aria-label="OpenDayCare"
          className={styles.brandHeader}
          name="OpenDayCare"
          variant="inverse"
        />
        <div className={styles.brandMessage}>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <p className={styles.brandEyebrow}>Guardería · {eyebrow}</p>
      </section>
      <section className={styles.formPanel}>{children}</section>
    </div>
  );
}
