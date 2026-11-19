"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type PasswordActionState,
} from "../_actions/change-password";
import { Button, FormField } from "@/presentation/ui";
import styles from "../account.module.css";

const initialState: PasswordActionState = {
  errors: {},
  message: "",
};

/**
 * Renders the interactive password replacement form.
 *
 * @returns A password form connected to its Server Action.
 */
export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className={styles.form} noValidate>
      <FormField className={styles.field} htmlFor="account-password" label="Nueva contraseña">
        <input
          aria-describedby={state.errors.password ? "account-password-error" : undefined}
          aria-invalid={state.errors.password ? "true" : undefined}
          className={styles.input}
          id="account-password"
          name="password"
          type="password"
        />
      </FormField>
      {state.errors.password ? (
        <p className={styles.error} id="account-password-error" role="alert">
          {state.errors.password}
        </p>
      ) : null}

      <FormField
        className={styles.field}
        htmlFor="account-password-confirmation"
        label="Confirmar contraseña"
      >
        <input
          aria-describedby={
            state.errors.confirmation
              ? "account-password-confirmation-error"
              : undefined
          }
          aria-invalid={state.errors.confirmation ? "true" : undefined}
          className={styles.input}
          id="account-password-confirmation"
          name="confirmation"
          type="password"
        />
      </FormField>
      {state.errors.confirmation ? (
        <p className={styles.error} id="account-password-confirmation-error" role="alert">
          {state.errors.confirmation}
        </p>
      ) : null}

      <Button className={styles.button} disabled={isPending} type="submit">
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
