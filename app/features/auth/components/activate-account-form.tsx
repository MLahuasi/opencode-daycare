"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, SubmitEvent } from "react";
import { useState } from "react";
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
  const [validationErrors, setValidationErrors] = useState({
    confirmation: false,
    password: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);

  function handleInput(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const requiredFields = ["code", "email", "password", "passwordConfirmation"];
    setIsFormComplete(requiredFields.every((field) => String(formData.get(field) ?? "").length > 0));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");
    const passwordIsInvalid = !isValidActivationPassword(password);
    const confirmationIsInvalid = password !== confirmation;
    setValidationErrors({
      confirmation: confirmationIsInvalid,
      password: passwordIsInvalid,
    });

    if (hasResolvedInvitation && !passwordIsInvalid && !confirmationIsInvalid) {
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

      <form onInput={handleInput} onSubmit={handleSubmit}>
        <FormField className={styles.field} label="CÓDIGO DE INVITACIÓN">
          <input defaultValue={code} name="code" readOnly={hasResolvedInvitation} required />
        </FormField>
        <FormField className={styles.field} label="EMAIL">
          <input autoComplete="email" defaultValue={email} name="email" readOnly={hasResolvedInvitation} required type="email" />
        </FormField>
        <FormField className={styles.field} label="CREAR CONTRASEÑA">
          <div className={styles.passwordInput}>
            <input aria-describedby="passwordError" aria-invalid={validationErrors.password} autoComplete="new-password" name="password" required type={showPassword ? "text" : "password"} />
            <PasswordVisibilityButton
              label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowPassword((visible) => !visible)}
              pressed={showPassword}
            />
          </div>
          <span className={styles.fieldHint}>Usa al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.</span>
          <span className={styles.validationError} hidden={!validationErrors.password} id="passwordError" role="alert">La contraseña no cumple la política requerida.</span>
        </FormField>
        <FormField className={styles.field} label="CONFIRMAR CONTRASEÑA">
          <div className={styles.passwordInput}>
            <input aria-describedby="confirmationError" aria-invalid={validationErrors.confirmation} autoComplete="new-password" name="passwordConfirmation" required type={showConfirmation ? "text" : "password"} />
            <PasswordVisibilityButton
              label={showConfirmation ? "Ocultar confirmación" : "Mostrar confirmación"}
              onClick={() => setShowConfirmation((visible) => !visible)}
              pressed={showConfirmation}
            />
          </div>
          <span className={styles.validationError} hidden={!validationErrors.confirmation} id="confirmationError" role="alert">Las contraseñas no coinciden.</span>
        </FormField>
        <CheckboxField
          className={styles.consentField}
          indicatorClassName={styles.consentBox}
          label="Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app."
          name="photoSharingConsent"
        />
        <Button className={styles.primaryButton} disabled={!isFormComplete} type="submit">Activar mi cuenta</Button>
      </form>
      <p className={styles.formFooter}>¿Ya tienes cuenta? <a className={styles.inlineLink} href="/login">Inicia sesión</a></p>
    </div>
  );
}

type PasswordVisibilityButtonProps = {
  label: string;
  onClick: () => void;
  pressed: boolean;
};

function PasswordVisibilityButton({ label, onClick, pressed }: PasswordVisibilityButtonProps) {
  return (
    <button aria-label={label} aria-pressed={pressed} className={styles.passwordToggle} onClick={onClick} type="button">
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        {pressed ? (
          <>
            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 8.7 4.1 9.8 7a12.7 12.7 0 0 1-2.2 3.6M6.2 6.2C3.9 7.7 2.6 10.2 2.2 12c.6 1.7 1.9 4 4.4 5.6A10.7 10.7 0 0 0 12 19c1.3 0 2.5-.2 3.6-.7" />
          </>
        ) : (
          <>
            <path d="M2.2 12C3.3 8.9 7 5 12 5s8.7 3.9 9.8 7c-1.1 3.1-4.8 7-9.8 7s-8.7-3.9-9.8-7Z" />
            <circle cx="12" cy="12" r="2.5" />
          </>
        )}
      </svg>
    </button>
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
