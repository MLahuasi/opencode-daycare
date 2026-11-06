"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";
import { useState } from "react";
import { Button, FormField, LinkButton } from "@/presentation/ui";
import styles from "./auth.module.css";

/**
 * Renders the login form and navigates to the role-specific feed after validation.
 *
 * @param props - Login state projected from the route.
 * @param props.activated - Whether the account was just activated.
 * @param props.daycareId - Tenant selected by the login URL.
 * @returns The login form.
 */
export function LoginForm({
  activated = false,
  daycareId,
}: {
  activated?: boolean;
  daycareId?: string;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    const selectedDaycareId = formData.get("daycareId");

    if (typeof selectedDaycareId !== "string" || !selectedDaycareId) {
      setIsPending(false);
      setErrorMessage("El enlace de acceso no contiene una guardería válida.");
      return;
    }

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      daycareId: selectedDaycareId,
      redirect: false,
    });

    setIsPending(false);

    if (result?.ok) {
      router.push("/home");
      return;
    }

    setErrorMessage("El email o la contraseña no son válidos.");
  }

  return (
    <div className={styles.formContent}>
      <h2>Iniciar sesión</h2>
      <p className={styles.formIntro}>Ingresa para ver el día de hoy.</p>
      {activated ? <p className={styles.activationSuccess} role="status">Tu cuenta fue activada. Ya puedes iniciar sesión.</p> : null}
      {errorMessage ? <p className={styles.invitationError} role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <input name="daycareId" type="hidden" value={daycareId ?? ""} />
        <FormField className={styles.field} label="EMAIL">
          <input autoComplete="email" name="email" required type="email" />
        </FormField>
        <FormField className={styles.field} label="CONTRASEÑA">
          <input autoComplete="current-password" name="password" required type="password" />
        </FormField>
        <div className={styles.forgotPassword}>¿Olvidaste tu contraseña?</div>
        <Button className={styles.primaryButton} disabled={isPending} type="submit">{isPending ? "Ingresando..." : "Iniciar sesión"}</Button>
      </form>
      <p className={styles.formFooter}>
        ¿Te invitó la guardería? <LinkButton className={styles.inlineLink} href="/auth/parent-invitation" variant="ghost">Activa tu cuenta</LinkButton>
      </p>
    </div>
  );
}
