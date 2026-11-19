"use client";

import { useActionState } from "react";
import { Button, FormField } from "@/presentation/ui";
import type {
  AccountProfileAction,
  AccountProfileState,
} from "./account-types";
import styles from "./account-forms.module.css";

type AccountProfileFormProps = {
  action: AccountProfileAction;
  idPrefix: string;
  initialState: AccountProfileState;
  name: string;
  phone: string | null;
};

/** Renders a reusable profile form for an account route. */
export function AccountProfileForm({
  action,
  idPrefix,
  initialState,
  name,
  phone,
}: AccountProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const nameId = `${idPrefix}-name`;
  const phoneId = `${idPrefix}-phone`;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <FormField className={styles.field} htmlFor={nameId} label="Nombre">
        <input
          aria-describedby={state.errors.name ? `${nameId}-error` : undefined}
          aria-invalid={state.errors.name ? "true" : undefined}
          className={styles.input}
          defaultValue={name}
          id={nameId}
          name="name"
          type="text"
        />
      </FormField>
      {state.errors.name ? (
        <p className={styles.error} id={`${nameId}-error`} role="alert">
          {state.errors.name}
        </p>
      ) : null}

      <FormField className={styles.field} htmlFor={phoneId} label="Teléfono">
        <input
          aria-describedby={state.errors.phone ? `${phoneId}-error` : undefined}
          aria-invalid={state.errors.phone ? "true" : undefined}
          className={styles.input}
          defaultValue={phone ?? ""}
          id={phoneId}
          name="phone"
          type="tel"
        />
      </FormField>
      {state.errors.phone ? (
        <p className={styles.error} id={`${phoneId}-error`} role="alert">
          {state.errors.phone}
        </p>
      ) : null}

      <Button className={styles.submitButton} disabled={isPending} type="submit">
        {isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
      {state.message ? (
        <p aria-live="polite" className={styles.status} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
