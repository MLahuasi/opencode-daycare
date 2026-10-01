"use client";

import { useActionState, useState } from "react";
import { Button, FormField, LinkButton } from "@/src/components/ui";
import {
  initialInviteParentActionState,
  sendInviteParentAction,
} from "../_actions";
import type { InviteParentActionState } from "../_actions";
import type { Kid } from "@/src/domain/kid";
import styles from "./invite-parent.module.css";

const relationshipOptions = [
  { label: "Mamá", value: "mother" },
  { label: "Papá", value: "father" },
  { label: "Tutor/a", value: "guardian" },
] as const;

type InviteParentFormProps = {
  /** Kid data shown in the invitation form. */
  kid: Pick<Kid, "id" | "name" | "slug">;
};

/**
 * Renders the protected parent invitation form for a kid profile.
 *
 * @param props - Kid data shown in the invitation form.
 * @param props.kid - Persisted kid associated with the invitation.
 * @returns The parent invitation form.
 */
export function InviteParentForm({ kid }: InviteParentFormProps) {
  const [actionState, formAction, isPending] = useActionState<
    InviteParentActionState,
    FormData
  >(sendInviteParentAction, initialInviteParentActionState);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);

  return (
    <main className={styles.page}>
      <section aria-labelledby="invite-parent-title" className={styles.card}>
        <header className={styles.header}>
          <div>
            <h1 id="invite-parent-title">Vincular padre</h1>
            <p>a {kid.name}</p>
          </div>
          <LinkButton
            aria-label={`Volver al perfil de ${kid.name}`}
            className={styles.closeButton}
            href={`/kids/${kid.slug}`}
            variant="ghost"
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </LinkButton>
        </header>

        <div className={styles.body}>
          <div className={styles.infoPanel} role="note">
            <p>
              Le enviaremos un correo para que active su cuenta. Solo verá el feed de {kid.name}.
            </p>
          </div>

          <form action={formAction} className={styles.form}>
            <input name="slug" type="hidden" value={kid.slug} />
            <FormField className={styles.field} label="NOMBRE DEL PADRE/MADRE">
              <input
                aria-invalid={Boolean(actionState.errors.name)}
                autoComplete="name"
                maxLength={120}
                name="name"
                placeholder="Ej. Diego Fernández"
                required
                type="text"
              />
              <span className={styles.validationError} hidden={!actionState.errors.name} role="alert">
                {actionState.errors.name}
              </span>
            </FormField>

            <FormField className={styles.field} label="EMAIL">
              <input
                aria-invalid={Boolean(actionState.errors.email)}
                autoComplete="email"
                name="email"
                placeholder="correo@ejemplo.com"
                required
                type="email"
              />
              <span className={styles.validationError} hidden={!actionState.errors.email} role="alert">
                {actionState.errors.email}
              </span>
            </FormField>

            <fieldset className={styles.relationshipField}>
              <legend>PARENTESCO</legend>
              <div className={styles.relationshipOptions}>
                {relationshipOptions.map((option) => (
                  <label
                    className={`${styles.relationshipOption} ${selectedRelationship === option.value ? styles.relationshipOptionSelected : ""}`}
                    key={option.value}
                  >
                    <input
                      checked={selectedRelationship === option.value}
                      name="relationship"
                      onChange={() => setSelectedRelationship(option.value)}
                      required
                      type="radio"
                      value={option.value}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <span className={styles.validationError} hidden={!actionState.errors.relationship} role="alert">
                {actionState.errors.relationship}
              </span>
            </fieldset>

            <div className={styles.codePanel}>
              <span>ENLACE DE INVITACIÓN</span>
              <strong aria-hidden="true">--------</strong>
              <p>Se generará al enviar y vencerá en 7 días.</p>
            </div>

            <Button className={styles.submitButton} disabled={isPending} type="submit">
              {isPending ? "Enviando..." : "Enviar invitación"}
            </Button>
            {actionState.message ? (
              <p className={styles.formMessage} role="alert">{actionState.message}</p>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}
