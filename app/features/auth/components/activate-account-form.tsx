"use client";

import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";
import { Button, CheckboxField, FormField } from "@/app/components/ui";
import { isValidActivationPassword } from "@/app/features/auth";
import styles from "./auth.module.css";

export type ActivationKidCardData = {
  initial: string;
  name: string;
  room: string;
};

export type ActivationInvitationState = "none" | "valid" | "unknown" | "expired" | "accepted";

type ActivateAccountFormProps = {
  code: string;
  email: string;
  invitationState: ActivationInvitationState;
  kid: ActivationKidCardData | null;
};

const invitationMessages: Record<Exclude<ActivationInvitationState, "none" | "valid">, string> = {
  unknown: "El código de invitación no es válido.",
  expired: "El código de invitación ya venció.",
  accepted: "El código de invitación ya fue utilizado.",
};

/**
 * Renders the account activation form for an invitation projection.
 *
 * @param props - Invitation and child data required by the form.
 * @param props.code - Invitation code, when it was resolved from the URL.
 * @param props.email - Invited person's email, when it was resolved.
 * @param props.invitationState - Resolution state of the invitation code.
 * @param props.kid - Optional child summary associated with the invitation.
 * @returns The account activation form.
 */
export function ActivateAccountForm({ code, email, invitationState, kid }: ActivateAccountFormProps) {
  const router = useRouter();
  const hasResolvedInvitation = invitationState === "valid";

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");
    const passwordError = form.elements.namedItem("passwordError");
    const confirmationError = form.elements.namedItem("confirmationError");

    if (passwordError instanceof HTMLElement) {
      passwordError.hidden = isValidActivationPassword(password);
    }
    if (confirmationError instanceof HTMLElement) {
      confirmationError.hidden = password === confirmation;
    }

    if (hasResolvedInvitation && isValidActivationPassword(password) && password === confirmation) {
      router.push("/familia-feed");
    }
  }

  return (
    <div className={styles.activationContent}>
      <div aria-hidden="true" className={styles.activationMark}>
        <svg fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </div>
      <h1>Bienvenida a OpenDayCare</h1>
      <p className={styles.activationIntro}>Te invitaron a seguir el día de tu hijo. Crea tu contraseña para activar la cuenta.</p>

      {kid ? <ActivationKidCard kid={kid} /> : null}
      {invitationState !== "none" && invitationState !== "valid" ? (
        <p className={styles.invitationError} role="alert">{invitationMessages[invitationState]}</p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <FormField className={styles.field} label="CÓDIGO DE INVITACIÓN">
          <input defaultValue={code} name="code" readOnly={hasResolvedInvitation} required />
        </FormField>
        <FormField className={styles.field} label="EMAIL">
          <input autoComplete="email" defaultValue={email} name="email" readOnly={hasResolvedInvitation} required type="email" />
        </FormField>
        <FormField className={styles.field} label="CREAR CONTRASEÑA">
          <input aria-describedby="passwordError" autoComplete="new-password" name="password" required type="password" />
          <span className={styles.fieldHint}>Usa al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.</span>
          <span className={styles.validationError} hidden id="passwordError" role="alert">La contraseña no cumple la política requerida.</span>
        </FormField>
        <FormField className={styles.field} label="CONFIRMAR CONTRASEÑA">
          <input aria-describedby="confirmationError" autoComplete="new-password" name="passwordConfirmation" required type="password" />
          <span className={styles.validationError} hidden id="confirmationError" role="alert">Las contraseñas no coinciden.</span>
        </FormField>
        <CheckboxField
          className={styles.consentField}
          indicatorClassName={styles.consentBox}
          label="Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app."
          name="photoSharingConsent"
        />
        <Button className={styles.primaryButton} disabled={!hasResolvedInvitation} type="submit">Activar mi cuenta</Button>
      </form>
      <p className={styles.formFooter}>¿Ya tienes cuenta? <a className={styles.inlineLink} href="/login">Inicia sesión</a></p>
    </div>
  );
}

type ActivationKidCardProps = { kid: ActivationKidCardData };

function ActivationKidCard({ kid }: ActivationKidCardProps) {
  return (
    <div className={styles.kidCard}>
      <div aria-hidden="true" className={styles.kidInitial}>{kid.initial}</div>
      <div>
        <span>Te invitaron a seguir a</span>
        <strong>{kid.name} · Sala {kid.room}</strong>
      </div>
    </div>
  );
}
