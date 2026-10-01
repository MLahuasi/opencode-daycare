"use client";

import { useActionState } from "react";
import { Button, CheckboxField, FormField } from "@/src/components/ui";
import {
  acceptParentInvitationAction,
  initialParentInvitationActionState,
} from "../_actions";
import type { ParentInvitationActionState } from "../_actions";
import styles from "@/app/features/auth/components/auth.module.css";

type ParentInvitationFormProps = {
  /** Invitation token received in the email URL. */
  code: string;
  /** Email associated with the pending parent account. */
  email: string;
  /** Whether the parent already has an active account. */
  existingActiveParent: boolean;
  /** Name of the kid associated with the invitation. */
  kidName: string;
};

/**
 * Renders the public form used to accept a valid parent invitation.
 *
 * @param props - Invitation and kid data resolved on the server.
 * @param props.code - Token received in the email URL.
 * @param props.email - Email associated with the pending parent account.
 * @param props.existingActiveParent - Whether password creation can be skipped.
 * @param props.kidName - Name of the kid associated with the invitation.
 * @returns The parent invitation acceptance form.
 */
export function ParentInvitationForm({
  code,
  email,
  existingActiveParent,
  kidName,
}: ParentInvitationFormProps) {
  const [actionState, formAction, isPending] = useActionState<
    ParentInvitationActionState,
    FormData
  >(acceptParentInvitationAction, initialParentInvitationActionState);

  return (
    <div className={styles.activationContent}>
      <div aria-hidden="true" className={styles.activationMark}>
        <svg fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </div>
      <h1>Bienvenida a OpenDayCare</h1>
      <p className={styles.activationIntro}>
        {existingActiveParent
          ? `Confirma la nueva vinculación familiar para ver a ${kidName} en tu cuenta.`
          : `Te invitaron a seguir el día de ${kidName}. Crea tu contraseña para activar la cuenta.`}
      </p>

      <form action={formAction}>
        <input name="code" type="hidden" value={code} />
        <FormField className={styles.field} label="EMAIL">
          <input autoComplete="email" defaultValue={email} name="email" required type="email" />
          <span className={styles.validationError} hidden={!actionState.errors.email} role="alert">
            {actionState.errors.email}
          </span>
        </FormField>

        {!existingActiveParent ? (
          <>
            <FormField className={styles.field} label="CREAR CONTRASEÑA">
              <input autoComplete="new-password" name="password" required type="password" />
              <span className={styles.fieldHint}>
                Usa al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.
              </span>
              <span className={styles.validationError} hidden={!actionState.errors.password} role="alert">
                {actionState.errors.password}
              </span>
            </FormField>
            <FormField className={styles.field} label="CONFIRMAR CONTRASEÑA">
              <input autoComplete="new-password" name="passwordConfirmation" required type="password" />
              <span className={styles.validationError} hidden={!actionState.errors.passwordConfirmation} role="alert">
                {actionState.errors.passwordConfirmation}
              </span>
            </FormField>
          </>
        ) : null}

        <CheckboxField
          className={styles.consentField}
          indicatorClassName={styles.consentBox}
          disabled={isPending}
          label="Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app."
          name="photoSharingConsent"
        />
        <span className={styles.validationError} hidden={!actionState.errors.photoSharingConsent} role="alert">
          {actionState.errors.photoSharingConsent}
        </span>
        <Button className={styles.primaryButton} disabled={isPending} type="submit">
          {isPending ? "Guardando..." : existingActiveParent ? "Confirmar vinculación" : "Activar mi cuenta"}
        </Button>
      </form>
      {actionState.message ? <p className={styles.invitationError} role="alert">{actionState.message}</p> : null}
    </div>
  );
}
