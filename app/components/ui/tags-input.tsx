"use client";

import { useRef, useState } from "react";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  KeyboardEvent,
} from "react";
import { parseCommaSeparatedTags } from "@/app/shared";
import styles from "./tags-input.module.css";

type TagsInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "onChange" | "type" | "value"
> & {
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  removeLabel?: string;
};

function mergeTags(currentTags: readonly string[], value: string): string[] {
  return parseCommaSeparatedTags([...currentTags, value].join(","));
}

/**
 * Renders a controlled tag editor backed by a serializable hidden form field.
 *
 * Native input attributes are applied to the text editor unless handled by the
 * composite control.
 *
 * @param props - Native input attributes and tag editor options.
 * @param props.className - Optional classes applied to the component wrapper.
 * @param props.name - Form field name used by the serialized hidden input.
 * @param props.onValueChange - Called with confirmed, deduplicated tags.
 * @param props.removeLabel - Accessible prefix for each tag removal button.
 * @param props.value - Confirmed tags controlled by the parent component.
 * @returns An accessible editor for adding and removing text tags.
 */
export function TagsInput({
  "aria-invalid": ariaInvalid,
  className = "",
  disabled = false,
  form,
  name,
  onKeyDown,
  onValueChange,
  readOnly = false,
  removeLabel = "Eliminar",
  required = false,
  value,
  ...inputProps
}: TagsInputProps) {
  const [pendingValue, setPendingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const tags = parseCommaSeparatedTags(value.join(","));
  const submittedTags = mergeTags(tags, pendingValue);
  const isInvalid =
    ariaInvalid === true ||
    ariaInvalid === "true" ||
    ariaInvalid === "grammar" ||
    ariaInvalid === "spelling";
  const isReadOnly = disabled || readOnly;

  function updateTags(nextTags: string[]) {
    const hasChanged =
      nextTags.length !== tags.length ||
      nextTags.some((tag, index) => tag !== tags[index]);

    if (hasChanged) {
      onValueChange(nextTags);
    }
  }

  function commitPendingValue() {
    updateTags(mergeTags(tags, pendingValue));
    setPendingValue("");
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value;
    const segments = nextValue.split(",");

    if (segments.length === 1) {
      setPendingValue(nextValue);
      return;
    }

    const remainingValue = segments.pop() ?? "";
    updateTags(mergeTags(tags, segments.join(",")));
    setPendingValue(remainingValue.trimStart());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented || event.nativeEvent.isComposing || isReadOnly) {
      return;
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitPendingValue();
      return;
    }

    if (event.key === "Backspace" && !pendingValue && tags.length > 0) {
      event.preventDefault();
      updateTags(tags.slice(0, -1));
    }
  }

  function removeTag(index: number) {
    inputRef.current?.focus();
    updateTags(tags.filter((_, tagIndex) => tagIndex !== index));
  }

  return (
    <div
      className={`${styles.root} ${className}`}
      data-disabled={isReadOnly ? "true" : undefined}
      data-invalid={isInvalid ? "true" : undefined}
    >
      {tags.map((tag, index) => (
        <span className={styles.tag} key={`${tag}-${index}`}>
          <span>{tag}</span>
          <button
            aria-label={`${removeLabel} ${tag}`}
            disabled={isReadOnly}
            onClick={() => removeTag(index)}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.2"
              viewBox="0 0 16 16"
            >
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </span>
      ))}
      <input
        {...inputProps}
        aria-invalid={ariaInvalid}
        aria-required={required}
        className={styles.input}
        disabled={disabled}
        form={form}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        ref={inputRef}
        required={required && tags.length === 0}
        type="text"
        value={pendingValue}
      />
      {name ? (
        <input
          disabled={disabled}
          form={form}
          name={name}
          readOnly
          type="hidden"
          value={submittedTags.join(", ")}
        />
      ) : null}
    </div>
  );
}
