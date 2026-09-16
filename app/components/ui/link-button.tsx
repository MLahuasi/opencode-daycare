import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.css";

type LinkButtonVariant = "coral" | "soft" | "ghost";

type LinkButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: string;
  variant?: LinkButtonVariant;
};

/**
 * Renders a navigational link with the visual treatment of a button.
 *
 * @param props - Link attributes and button visual customization options.
 * @param props.children - Content displayed inside the link.
 * @param props.href - Destination route or URL.
 * @param props.variant - Visual treatment: `coral`, `soft`, or `ghost`.
 * @param props.className - Optional classes applied to the link.
 * @returns A styled Next.js navigation link.
 */
export function LinkButton({
  children,
  className = "",
  href,
  variant = "coral",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`${styles.button} ${styles[variant]} ${className}`}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}
