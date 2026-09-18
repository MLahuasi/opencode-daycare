"use client";

import { useId, useState } from "react";
import type { FormHTMLAttributes, SubmitEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  FormField,
  LinkButton,
  TagsInput,
} from "@/app/components/ui";
import { parseCommaSeparatedTags } from "@/app/shared";
import { validateKidForm } from "../schemas";
import type { KidFormErrors } from "../schemas";
import type { KidFormValues, Room } from "../types";
import styles from "./kid-form.module.css";

type KidFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "children"> & {
  cancelHref: string;
  disabled?: boolean;
  heading: string;
  initialValues: KidFormValues;
  loadingLabel?: string;
  rooms: readonly Room[];
  submitLabel?: string;
};

type KidFormContentProps = {
  allergies: string[];
  birthDate: string;
  cancelHref: string;
  disabled: boolean;
  errors: KidFormErrors;
  fieldIdPrefix: string;
  heading: string;
  initialValues: KidFormValues;
  loadingLabel: string;
  onAllergiesChange: (value: string[]) => void;
  onBirthDateChange: (value: string) => void;
  onFieldChange: (field: keyof KidFormValues) => void;
  rooms: readonly Room[];
  submitLabel: string;
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const FIELD_ORDER: Array<keyof KidFormValues> = [
  "name",
  "birthDate",
  "roomId",
  "allergies",
  "medicalNotes",
];

function applyDateMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function getInitialDisplayDate(value: string): string {
  const isoDate = ISO_DATE_PATTERN.exec(value);

  if (isoDate) {
    return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  }

  return applyDateMask(value);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <span className={styles.error} id={id} role="alert">
      {message}
    </span>
  );
}

function KidFormContent({
  allergies,
  birthDate,
  cancelHref,
  disabled,
  errors,
  fieldIdPrefix,
  heading,
  initialValues,
  loadingLabel,
  onAllergiesChange,
  onBirthDateChange,
  onFieldChange,
  rooms,
  submitLabel,
}: KidFormContentProps) {
  const { pending } = useFormStatus();
  const controlsDisabled = disabled || pending;
  const errorId = (field: keyof KidFormValues) =>
    `${fieldIdPrefix}-${field}-error`;

  return (
    <>
      <header className={styles.header}>
        <LinkButton className={styles.cancelAction} href={cancelHref} variant="ghost">
          Cancelar
        </LinkButton>
        <h1>{heading}</h1>
        <Button
          aria-busy={pending}
          className={styles.submitAction}
          disabled={controlsDisabled}
          type="submit"
          variant="ghost"
        >
          <span aria-live="polite">{pending ? loadingLabel : submitLabel}</span>
        </Button>
      </header>

      <fieldset className={styles.fieldset} disabled={controlsDisabled}>
        <p className={styles.requiredLegend}>
          <span aria-hidden="true">*</span> Campos obligatorios
        </p>

        <div className={styles.fields}>
          <FormField
            className={`${styles.field} ${styles.requiredField}`}
            label="NOMBRE COMPLETO"
          >
            <input
              aria-describedby={errors.name ? errorId("name") : undefined}
              aria-invalid={Boolean(errors.name)}
              autoComplete="off"
              defaultValue={initialValues.name}
              maxLength={120}
              name="name"
              onChange={() => onFieldChange("name")}
              placeholder="Ej. Martina López"
              required
              type="text"
            />
            <FieldError id={errorId("name")} message={errors.name} />
          </FormField>

          <div className={styles.row}>
            <FormField
              className={`${styles.field} ${styles.requiredField}`}
              label="FECHA DE NACIMIENTO"
            >
              <input
                aria-describedby={
                  errors.birthDate ? errorId("birthDate") : undefined
                }
                aria-invalid={Boolean(errors.birthDate)}
                autoComplete="off"
                inputMode="numeric"
                maxLength={10}
                name="birthDate"
                onChange={(event) => {
                  onBirthDateChange(applyDateMask(event.currentTarget.value));
                  onFieldChange("birthDate");
                }}
                placeholder="dd/mm/aaaa"
                required
                type="text"
                value={birthDate}
              />
              <FieldError
                id={errorId("birthDate")}
                message={errors.birthDate}
              />
            </FormField>

            <FormField
              className={`${styles.field} ${styles.requiredField}`}
              label="SALA"
            >
              <span
                className={styles.selectControl}
                data-invalid={errors.roomId ? "true" : undefined}
              >
                <select
                  aria-describedby={errors.roomId ? errorId("roomId") : undefined}
                  aria-invalid={Boolean(errors.roomId)}
                  defaultValue={initialValues.roomId}
                  name="roomId"
                  onChange={() => onFieldChange("roomId")}
                  required
                >
                  <option value="">Selecciona una sala</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <FieldError id={errorId("roomId")} message={errors.roomId} />
            </FormField>
          </div>

          <FormField className={styles.field} label="ALERGIAS (ETIQUETAS)">
            <TagsInput
              aria-describedby={
                errors.allergies ? errorId("allergies") : undefined
              }
              aria-invalid={Boolean(errors.allergies)}
              disabled={controlsDisabled}
              name="allergies"
              onValueChange={(value) => {
                onAllergiesChange(value);
                onFieldChange("allergies");
              }}
              placeholder="Ej. Maní, Lactosa"
              value={allergies}
            />
            <FieldError
              id={errorId("allergies")}
              message={errors.allergies}
            />
          </FormField>

          <FormField className={styles.field} label="NOTAS MÉDICAS">
            <textarea
              aria-describedby={
                errors.medicalNotes ? errorId("medicalNotes") : undefined
              }
              aria-invalid={Boolean(errors.medicalNotes)}
              defaultValue={initialValues.medicalNotes}
              name="medicalNotes"
              onChange={() => onFieldChange("medicalNotes")}
              placeholder="Indicaciones, medicación, contactos..."
              rows={4}
            />
            <FieldError
              id={errorId("medicalNotes")}
              message={errors.medicalNotes}
            />
          </FormField>
        </div>
      </fieldset>
    </>
  );
}

/**
 * Renders the shared Add and Edit form for a kid.
 *
 * Native form attributes, including a Server Action, can be passed through.
 *
 * @param props - Native form attributes and kid form configuration.
 * @param props.cancelHref - Destination used by the cancel action.
 * @param props.className - Optional classes applied to the form card.
 * @param props.disabled - Whether all editable controls and submit are disabled.
 * @param props.heading - Heading displayed in the form toolbar.
 * @param props.initialValues - Initial editable values for Add or Edit.
 * @param props.loadingLabel - Label displayed while the form action is pending.
 * @param props.rooms - Available room options.
 * @param props.submitLabel - Label displayed by the submit action.
 * @returns The shared kid form card.
 */
export function KidForm({
  "aria-label": ariaLabel,
  cancelHref,
  className = "",
  disabled = false,
  heading,
  initialValues,
  loadingLabel = "Guardando...",
  onSubmit,
  rooms,
  submitLabel = "Guardar",
  ...formProps
}: KidFormProps) {
  const [allergies, setAllergies] = useState(() =>
    parseCommaSeparatedTags(initialValues.allergies),
  );
  const [birthDate, setBirthDate] = useState(() =>
    getInitialDisplayDate(initialValues.birthDate),
  );
  const [errors, setErrors] = useState<KidFormErrors>({});
  const fieldIdPrefix = useId();

  function clearFieldError(field: keyof KidFormValues) {
    setErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const result = validateKidForm(
      {
        name: formData.get("name"),
        birthDate: formData.get("birthDate"),
        roomId: formData.get("roomId"),
        allergies: formData.get("allergies"),
        medicalNotes: formData.get("medicalNotes"),
      },
      rooms,
    );

    if (!result.success) {
      event.preventDefault();
      setErrors(result.errors);

      const firstInvalidField = FIELD_ORDER.find(
        (field) => result.errors[field],
      );
      const invalidControl = firstInvalidField
        ? event.currentTarget.elements.namedItem(firstInvalidField)
        : null;

      if (invalidControl instanceof HTMLElement) {
        invalidControl.focus();
      }

      return;
    }

    setErrors({});
    onSubmit?.(event);
  }

  return (
    <form
      {...formProps}
      aria-label={ariaLabel ?? heading}
      className={`${styles.form} ${className}`}
      noValidate
      onSubmit={handleSubmit}
    >
      <KidFormContent
        allergies={allergies}
        birthDate={birthDate}
        cancelHref={cancelHref}
        disabled={disabled}
        errors={errors}
        fieldIdPrefix={fieldIdPrefix}
        heading={heading}
        initialValues={initialValues}
        loadingLabel={loadingLabel}
        onAllergiesChange={setAllergies}
        onBirthDateChange={setBirthDate}
        onFieldChange={clearFieldError}
        rooms={rooms}
        submitLabel={submitLabel}
      />
    </form>
  );
}
