"use client";

import { useState } from "react";
import type { FormHTMLAttributes } from "react";
import {
  Button,
  FormField,
  LinkButton,
  TagsInput,
} from "@/app/components/ui";
import { parseCommaSeparatedTags } from "@/app/shared";
import type { KidFormValues, Room } from "../types";
import styles from "./kid-form.module.css";

type KidFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "children"> & {
  cancelHref: string;
  heading: string;
  initialValues: KidFormValues;
  rooms: readonly Room[];
  submitLabel?: string;
};

/**
 * Renders the shared Add and Edit form for a kid.
 *
 * Native form attributes, including a Server Action, can be passed through.
 *
 * @param props - Native form attributes and kid form configuration.
 * @param props.cancelHref - Destination used by the cancel action.
 * @param props.className - Optional classes applied to the form card.
 * @param props.heading - Heading displayed in the form toolbar.
 * @param props.initialValues - Initial editable values for Add or Edit.
 * @param props.rooms - Available room options.
 * @param props.submitLabel - Label displayed by the submit action.
 * @returns The shared kid form card.
 */
export function KidForm({
  "aria-label": ariaLabel,
  cancelHref,
  className = "",
  heading,
  initialValues,
  rooms,
  submitLabel = "Guardar",
  ...formProps
}: KidFormProps) {
  const [allergies, setAllergies] = useState(() =>
    parseCommaSeparatedTags(initialValues.allergies),
  );

  return (
    <form
      {...formProps}
      aria-label={ariaLabel ?? heading}
      className={`${styles.form} ${className}`}
    >
      <header className={styles.header}>
        <LinkButton className={styles.cancelAction} href={cancelHref} variant="ghost">
          Cancelar
        </LinkButton>
        <h1>{heading}</h1>
        <Button className={styles.submitAction} type="submit" variant="ghost">
          {submitLabel}
        </Button>
      </header>

      <div className={styles.fields}>
        <FormField className={styles.field} label="NOMBRE COMPLETO">
          <input
            autoComplete="off"
            defaultValue={initialValues.name}
            name="name"
            placeholder="Ej. Martina López"
            type="text"
          />
        </FormField>

        <div className={styles.row}>
          <FormField className={styles.field} label="FECHA DE NACIMIENTO">
            <input
              autoComplete="off"
              defaultValue={initialValues.birthDate}
              inputMode="numeric"
              name="birthDate"
              placeholder="dd/mm/aaaa"
              type="text"
            />
          </FormField>

          <FormField className={styles.field} label="SALA">
            <span className={styles.selectControl}>
              <select defaultValue={initialValues.roomId} name="roomId">
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
          </FormField>
        </div>

        <FormField className={styles.field} label="ALERGIAS (ETIQUETAS)">
          <TagsInput
            name="allergies"
            onValueChange={setAllergies}
            placeholder="Ej. Maní, Lactosa"
            value={allergies}
          />
        </FormField>

        <FormField className={styles.field} label="NOTAS MÉDICAS">
          <textarea
            defaultValue={initialValues.medicalNotes}
            name="medicalNotes"
            placeholder="Indicaciones, medicación, contactos..."
            rows={4}
          />
        </FormField>
      </div>
    </form>
  );
}
