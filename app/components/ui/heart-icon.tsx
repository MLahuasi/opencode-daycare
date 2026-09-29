import type { SVGAttributes } from "react";

/**
 * Renders a reusable filled heart icon.
 *
 * @param props - Native SVG attributes, including optional className.
 * @returns An accessible decorative heart icon.
 */
export function HeartIcon(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
