import type { HTMLAttributes } from "react";
import { SunIcon } from "./sun-icon";
import styles from "./brand.module.css";

type BrandProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  room?: string;
  variant?: "default" | "inverse";
};

/**
 * Renders the daycare brand mark and room identity.
 *
 * @param props - Brand content and native div attributes.
 * @param props.name - Name displayed beside the brand mark.
 * @param props.room - Optional room or context displayed below the name.
 * @param props.variant - Color treatment for the brand identity.
 * @param props.className - Optional classes applied to the brand wrapper.
 * @returns A branded identity block.
 */
export function Brand({
  className = "",
  name,
  room = "",
  variant = "default",
  ...props
}: BrandProps) {
  return (
    <div className={`${styles.brand} ${styles[variant]} ${className}`} {...props}>
      <div className={styles.mark} aria-hidden="true">
        <SunIcon strokeWidth="2.2" />
      </div>
      <div>
        <p className={styles.name}>{name}</p>
        {room ? <p className={styles.room}>{room}</p> : null}
      </div>
    </div>
  );
}
