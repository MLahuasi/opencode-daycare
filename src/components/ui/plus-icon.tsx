import type { SVGAttributes } from "react";

/** Renders a reusable plus icon. */
export function PlusIcon(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
