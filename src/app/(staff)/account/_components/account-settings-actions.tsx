"use client";

import { useState } from "react";
import { Button } from "@/presentation/ui";
import {
  AccountModal,
  AccountPasswordForm,
  AccountProfileForm,
  type AccountPasswordState,
  type AccountProfileState,
} from "@/presentation/account";
import {
  changeStaffPasswordAction,
} from "../_actions/change-staff-password";
import {
  updateStaffAccountAction,
} from "../_actions/update-staff-account";
import styles from "../account.module.css";

type Props = { mode: "profile" | "security"; name: string; phone: string | null };

const profileInitialState: AccountProfileState = { errors: {}, message: "" };
const passwordInitialState: AccountPasswordState = { errors: {}, message: "" };

/** Provides profile and security actions for the staff account page. */
export function AccountSettingsActions({ mode, name, phone }: Props) {
  const [activeModal, setActiveModal] = useState<"profile" | "password" | null>(null);
  const closeModal = () => {
    const returnId = activeModal === "profile" ? "staff-account-edit" : "staff-account-password";
    setActiveModal(null);
    window.setTimeout(() => document.getElementById(returnId)?.focus(), 0);
  };

  if (mode === "profile") {
    return (
      <>
        <Button className={styles.editButton} id="staff-account-edit" onClick={() => setActiveModal("profile")} variant="soft">Editar</Button>
        {activeModal === "profile" ? <AccountModal idPrefix="staff-account-profile" onClose={closeModal} restoreFocusId="staff-account-edit" title="Editar datos de cuenta"><AccountProfileForm action={updateStaffAccountAction} idPrefix="staff-account-profile" initialState={profileInitialState} name={name} phone={phone} /></AccountModal> : null}
      </>
    );
  }

  return (
    <>
      <div className={styles.actionList}>
        <Button className={styles.actionButton} id="staff-account-password" onClick={() => setActiveModal("password")} variant="ghost"><span>Cambiar contraseña</span><span aria-hidden="true">›</span></Button>
        <Button className={styles.actionButton} disabled variant="ghost"><span>Ayuda y soporte</span><span aria-hidden="true">›</span></Button>
      </div>
      {activeModal === "password" ? <AccountModal idPrefix="staff-account-password-modal" onClose={closeModal} restoreFocusId="staff-account-password" title="Cambiar contraseña"><AccountPasswordForm action={changeStaffPasswordAction} idPrefix="staff-account-password" initialState={passwordInitialState} /></AccountModal> : null}
    </>
  );
}
