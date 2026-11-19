"use client";

import { useState, type ReactNode } from "react";
import { AccountProfileForm } from "./account-profile-form";
import { PasswordForm } from "./password-form";
import { Button } from "@/presentation/ui";
import styles from "../account.module.css";

type AccountSettingsActionsProps = {
  mode: "profile" | "security";
  name: string;
  phone: string | null;
};

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
  title: string;
};

function AccountModal({ children, onClose, title }: ModalProps) {
  return (
    <div className={styles.modalBackdrop} role="presentation">
      <div
        aria-labelledby="account-modal-title"
        aria-modal="true"
        className={styles.modal}
        role="dialog"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} id="account-modal-title">
            {title}
          </h2>
          <Button
            aria-label="Cerrar ventana"
            className={styles.closeButton}
            onClick={onClose}
            variant="ghost"
          >
            ×
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Provides separate modal entry points for profile and password forms.
 *
 * @param props - Current values needed to initialize the profile form.
 * @param props.name - Current parent name.
 * @param props.phone - Current normalized phone number, when available.
 * @returns Profile edit and account action controls.
 */
export function AccountSettingsActions({
  mode,
  name,
  phone,
}: AccountSettingsActionsProps) {
  const [activeModal, setActiveModal] = useState<"profile" | "password" | null>(
    null,
  );

  if (mode === "profile") {
    return (
      <>
        <Button
          className={styles.editButton}
          onClick={() => setActiveModal("profile")}
          variant="soft"
        >
          Editar
        </Button>
        {activeModal === "profile" ? (
          <AccountModal
            onClose={() => setActiveModal(null)}
            title="Editar datos de cuenta"
          >
            <AccountProfileForm name={name} phone={phone} />
          </AccountModal>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className={styles.actionList}>
        <Button
          className={styles.actionButton}
          onClick={() => setActiveModal("password")}
          variant="ghost"
        >
          <span>Cambiar contraseña</span>
          <span aria-hidden="true">›</span>
        </Button>
        <Button className={styles.actionButton} disabled variant="ghost">
          <span>Ayuda y soporte</span>
          <span aria-hidden="true">›</span>
        </Button>
      </div>

      {activeModal === "password" ? (
        <AccountModal
          onClose={() => setActiveModal(null)}
          title="Cambiar contraseña"
        >
          <PasswordForm />
        </AccountModal>
      ) : null}
    </>
  );
}
