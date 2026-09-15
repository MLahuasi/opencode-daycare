import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.css";

type ButtonVariant = "coral" | "soft" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

/**
 * Renders a presentational button with accessible visual interaction states.
 *
 * @param props - Native button attributes, including optional event handlers.
 * @param props.children - Content displayed within the button.
 * @param props.className - Optional classes that customize the component.
 * @param props.type - Native button type, which defaults to `button`.
 * @param props.variant - Visual treatment: `coral`, `soft`, or `ghost`.
 * @returns A styled button element.
 */
export function Button({
  children,
  className = "",
  type = "button",
  variant = "coral",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
