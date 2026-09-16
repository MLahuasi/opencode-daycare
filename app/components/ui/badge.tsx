import type { HTMLAttributes, ReactNode } from "react";
import styles from "./badge.module.css";

type BadgeVariant = "coral" | "pink" | "green" | "yellow" | "blue" | "purple" | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

/**
 * Renders a compact status or category label.
 *
 * @param props - Badge configuration and native span attributes.
 * @param props.children - Label displayed inside the badge.
 * @param props.variant - Semantic color treatment for the badge.
 * @param props.className - Optional classes applied to the badge.
 * @returns A styled badge span.
 */
export function Badge({
  children,
  className = "",
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
