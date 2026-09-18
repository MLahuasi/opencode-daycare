"use client";

import { useActionState, useId, useState } from "react";
import type { SubmitEvent } from "react";
import {
  Button,
  FormField,
  LinkButton,
  TagsInput,
} from "@/app/components/ui";
import { parseCommaSeparatedTags } from "@/app/shared";
import type { KidFormAction, KidFormActionState } from "../actions/types";
import { validateKidForm } from "../schemas";
import type { KidFormErrors } from "../schemas";
import type { KidFormValues, Room } from "../types";
import styles from "./kid-form.module.css";

type KidFormProps = {
  action: KidFormAction;
  cancelHref: string;
  className?: string;
  disabled?: boolean;
  heading: string;
  initialValues: KidFormValues;
  loadingLabel?: string;
  rooms: readonly Room[];
  submitLabel?: string;
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const FIELD_ORDER: Array<keyof KidFormValues> = [
  "name",
  "birthDate",
  "roomId",
  "allergies",
  "medicalNotes",
];
const INITIAL_ACTION_STATE: KidFormActionState = {
  errors: {},
  message: "",
};

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

/**
 * Renders the shared Add and Edit form for a kid.
 *
 * @param props - Kid form configuration.
 * @param props.action - Server Action used to validate and persist the form.
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
  action,
  cancelHref,
  className = "",
  disabled = false,
  heading,
  initialValues,
  loadingLabel = "Guardando...",
  rooms,
  submitLabel = "Guardar",
}: KidFormProps) {
  const [actionState, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );
  const [allergies, setAllergies] = useState(() =>
    parseCommaSeparatedTags(initialValues.allergies),
  );
  const [birthDate, setBirthDate] = useState(() =>
    getInitialDisplayDate(initialValues.birthDate),
  );
  const [name, setName] = useState(initialValues.name);
  const [roomId, setRoomId] = useState(initialValues.roomId);
  const [medicalNotes, setMedicalNotes] = useState(initialValues.medicalNotes);
  const [clientErrors, setClientErrors] = useState<KidFormErrors>({});
  const fieldIdPrefix = useId();
  const controlsDisabled = disabled || pending;
  const errors = { ...actionState.errors, ...clientErrors };
  const errorId = (field: keyof KidFormValues) =>
    `${fieldIdPrefix}-${field}-error`;

  function clearFieldError(field: keyof KidFormValues) {
    setClientErrors((currentErrors) => {
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
      setClientErrors(result.errors);

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

    setClientErrors({});
  }

  return (
    <form
      action={formAction}
      aria-label={heading}
      className={`${styles.form} ${className}`}
      noValidate
      onSubmit={handleSubmit}
    >
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

        {actionState.message ? (
          <p className={styles.formError} role="alert">
            {actionState.message}
          </p>
        ) : null}

        <div className={styles.fields}>
          <FormField
            className={`${styles.field} ${styles.requiredField}`}
            label="NOMBRE COMPLETO"
          >
            <input
              aria-describedby={errors.name ? errorId("name") : undefined}
              aria-invalid={Boolean(errors.name)}
              autoComplete="off"
              maxLength={120}
              name="name"
              onChange={(event) => {
                setName(event.currentTarget.value);
                clearFieldError("name");
              }}
              placeholder="Ej. Martina López"
              required
              type="text"
              value={name}
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
                  setBirthDate(applyDateMask(event.currentTarget.value));
                  clearFieldError("birthDate");
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
                  name="roomId"
                  onChange={(event) => {
                    setRoomId(event.currentTarget.value);
                    clearFieldError("roomId");
                  }}
                  required
                  value={roomId}
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
                setAllergies(value);
                clearFieldError("allergies");
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
              name="medicalNotes"
              onChange={(event) => {
                setMedicalNotes(event.currentTarget.value);
                clearFieldError("medicalNotes");
              }}
              placeholder="Indicaciones, medicación, contactos..."
              rows={4}
              value={medicalNotes}
            />
            <FieldError
              id={errorId("medicalNotes")}
              message={errors.medicalNotes}
            />
          </FormField>
        </div>
      </fieldset>
    </form>
  );
}
