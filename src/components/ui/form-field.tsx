import type { LabelHTMLAttributes, ReactNode } from "react";

type FormFieldProps = LabelHTMLAttributes<HTMLLabelElement> & {
  label: string;
  children: ReactNode;
};

/**
 * Renders a labeled form control wrapper with native label attributes.
 *
 * @param props - Label attributes and field content.
 * @param props.label - Visible label displayed above the field.
 * @param props.children - Form control and any supporting content.
 * @param props.className - Optional classes applied to the wrapper.
 * @returns A labeled form field wrapper.
 */
export function FormField({ children, className = "", label, ...props }: FormFieldProps) {
  return (
    <label className={className} {...props}>
      <span>{label}</span>
      {children}
    </label>
  );
}
