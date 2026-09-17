import type { HTMLAttributes } from "react";
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
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </div>
      <div>
        <p className={styles.name}>{name}</p>
        {room ? <p className={styles.room}>{room}</p> : null}
      </div>
    </div>
  );
}
