"use client";

import { useState } from "react";
import { Button, FormField, LinkButton } from "@/app/components/ui";
import type { LinkParentKid } from "../types";
import styles from "./link-parent.module.css";

const relationshipOptions = [
  { label: "Mamá", value: "mother" },
  { label: "Papá", value: "father" },
  { label: "Tutor/a", value: "guardian" },
] as const;

type LinkParentFormProps = {
  kid: LinkParentKid;
};

/**
 * Renders the responsive parent-link invitation form.
 *
 * @param props - Kid data shown in the invitation form.
 * @param props.kid - Persisted kid associated with the invitation.
 * @returns The parent-link invitation form.
 */
export function LinkParentForm({ kid }: LinkParentFormProps) {
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);

  return (
    <main className={styles.page}>
      <section aria-labelledby="link-parent-title" className={styles.card}>
        <header className={styles.header}>
          <div>
            <h1 id="link-parent-title">Vincular padre</h1>
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
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            <p>
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {kid.name}.
            </p>
          </div>

          <form className={styles.form}>
            <FormField className={styles.field} label="NOMBRE DEL PADRE/MADRE">
              <input
                autoComplete="name"
                maxLength={120}
                name="name"
                placeholder="Ej. Diego Fernández"
                required
                type="text"
              />
            </FormField>

            <FormField className={styles.field} label="EMAIL">
              <input
                autoComplete="email"
                name="email"
                placeholder="correo@ejemplo.com"
                required
                type="email"
              />
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
            </fieldset>

            <div className={styles.codePanel}>
              <span>CÓDIGO DE INVITACIÓN</span>
              <strong aria-hidden="true">--------</strong>
              <p>Se generará al enviar y vencerá en 7 días.</p>
            </div>

            <Button className={styles.submitButton} type="submit">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path d="m22 2-7 20-4-9-9-4zM22 2 11 13" />
              </svg>
              Enviar invitación
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
