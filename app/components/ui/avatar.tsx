import type { HTMLAttributes } from "react";
import styles from "./avatar.module.css";

type AvatarTone = "coral" | "blue" | "pink" | "green" | "yellow" | "purple";
type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  initial: string;
  size?: AvatarSize;
  tone?: AvatarTone;
};

/**
 * Renders an initial-based avatar with configurable size and color treatment.
 *
 * @param props - Avatar configuration and native span attributes.
 * @param props.initial - Initial or short label displayed inside the avatar.
 * @param props.size - Avatar size, from compact to large.
 * @param props.tone - Background and foreground color treatment.
 * @param props.className - Optional classes applied to the avatar.
 * @returns An initial-based avatar span.
 */
export function Avatar({
  className = "",
  initial,
  size = "md",
  tone = "coral",
  ...props
}: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${styles[size]} ${styles[tone]} ${className}`}
      {...props}
    >
      {initial}
    </span>
  );
}
