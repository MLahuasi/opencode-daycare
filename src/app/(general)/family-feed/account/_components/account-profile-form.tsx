"use client";

import { useActionState } from "react";
import { updateAccountAction, type AccountActionState } from "../_actions/update-account";
import { Button, FormField } from "@/presentation/ui";
import styles from "../account.module.css";

const initialState: AccountActionState = {
  errors: {},
  message: "",
};

type AccountProfileFormProps = {
  name: string;
  phone: string | null;
};

/**
 * Renders the interactive family profile form.
 *
 * @param props - Persisted profile values used as initial form values.
 * @param props.name - Current parent name.
 * @param props.phone - Current normalized phone number, when available.
 * @returns A profile form connected to its Server Action.
 */
export function AccountProfileForm({
  name,
  phone,
}: AccountProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateAccountAction,
    initialState,
  );

  return (
    <form action={formAction} className={styles.form} noValidate>
      <FormField className={styles.field} htmlFor="account-name" label="Nombre">
        <input
          aria-describedby={state.errors.name ? "account-name-error" : undefined}
          aria-invalid={state.errors.name ? "true" : undefined}
          className={styles.input}
          defaultValue={name}
          id="account-name"
          name="name"
          type="text"
        />
      </FormField>
      {state.errors.name ? (
        <p className={styles.error} id="account-name-error" role="alert">
          {state.errors.name}
        </p>
      ) : null}

      <FormField className={styles.field} htmlFor="account-phone" label="Teléfono">
        <input
          aria-describedby={state.errors.phone ? "account-phone-error" : undefined}
          aria-invalid={state.errors.phone ? "true" : undefined}
          className={styles.input}
          defaultValue={phone ?? ""}
          id="account-phone"
          name="phone"
          type="tel"
        />
      </FormField>
      {state.errors.phone ? (
        <p className={styles.error} id="account-phone-error" role="alert">
          {state.errors.phone}
        </p>
      ) : null}

      <Button className={styles.button} disabled={isPending} type="submit">
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
