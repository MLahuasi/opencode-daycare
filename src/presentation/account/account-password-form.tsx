"use client";

import { useActionState } from "react";
import { Button, FormField } from "@/presentation/ui";
import type {
  AccountPasswordAction,
  AccountPasswordState,
} from "./account-types";
import styles from "./account-forms.module.css";

type AccountPasswordFormProps = {
  action: AccountPasswordAction;
  idPrefix: string;
  initialState: AccountPasswordState;
};

/** Renders a reusable password form for an account route. */
export function AccountPasswordForm({
  action,
  idPrefix,
  initialState,
}: AccountPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const passwordId = `${idPrefix}-password`;
  const confirmationId = `${idPrefix}-confirmation`;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <FormField className={styles.field} htmlFor={passwordId} label="Nueva contraseña">
        <input
          aria-describedby={state.errors.password ? `${passwordId}-error` : undefined}
          aria-invalid={state.errors.password ? "true" : undefined}
          className={styles.input}
          id={passwordId}
          name="password"
          type="password"
        />
      </FormField>
      {state.errors.password ? (
        <p className={styles.error} id={`${passwordId}-error`} role="alert">
          {state.errors.password}
        </p>
      ) : null}

      <FormField
        className={styles.field}
        htmlFor={confirmationId}
        label="Confirmar contraseña"
      >
        <input
          aria-describedby={
            state.errors.confirmation ? `${confirmationId}-error` : undefined
          }
          aria-invalid={state.errors.confirmation ? "true" : undefined}
          className={styles.input}
          id={confirmationId}
          name="confirmation"
          type="password"
        />
      </FormField>
      {state.errors.confirmation ? (
        <p className={styles.error} id={`${confirmationId}-error`} role="alert">
          {state.errors.confirmation}
        </p>
      ) : null}

      <Button className={styles.submitButton} disabled={isPending} type="submit">
        {isPending ? "Actualizando…" : "Cambiar contraseña"}
      </Button>
      {state.message ? (
        <p aria-live="polite" className={styles.status} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
