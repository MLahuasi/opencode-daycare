import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  indicatorClassName?: string;
};

/**
 * Renders a checkbox input with a customizable visual indicator.
 *
 * @param props - Checkbox attributes and presentation options.
 * @param props.label - Content displayed beside the checkbox.
 * @param props.indicatorClassName - Optional classes applied to the visual indicator.
 * @param props.className - Optional classes applied to the label wrapper.
 * @returns A labeled checkbox field.
 */
export function CheckboxField({
  className = "",
  indicatorClassName = "",
  label,
  ...props
}: CheckboxFieldProps) {
  return (
    <label className={className}>
      <input type="checkbox" {...props} />
      <span aria-hidden="true" className={indicatorClassName}>
        <svg fill="none" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  );
}
