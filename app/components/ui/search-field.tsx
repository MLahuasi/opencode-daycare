import type { InputHTMLAttributes } from "react";
import styles from "./search-field.module.css";

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

/**
 * Renders a styled search input with an accessible label and search icon.
 *
 * @param props - Search input attributes and visual customization options.
 * @param props.label - Accessible label for the search input.
 * @param props.className - Optional classes applied to the field wrapper.
 * @returns A search field wrapper containing the input control.
 */
export function SearchField({
  className = "",
  label = "Buscar",
  ...props
}: SearchFieldProps) {
  return (
    <label className={`${styles.field} ${className}`}>
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span className={styles.visuallyHidden}>{label}</span>
      <input aria-label={label} type="search" {...props} />
    </label>
  );
}
