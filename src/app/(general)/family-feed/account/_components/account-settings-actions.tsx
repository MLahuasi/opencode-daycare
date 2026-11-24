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
  changePasswordAction,
} from "../_actions/change-password";
import {
  updateAccountAction,
} from "../_actions/update-account";
import styles from "../account.module.css";

type AccountSettingsActionsProps = {
  mode: "profile" | "security";
  name: string;
  phone: string | null;
};

const profileInitialState: AccountProfileState = { errors: {}, message: "" };
const passwordInitialState: AccountPasswordState = { errors: {}, message: "" };

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
          id="family-account-edit"
          onClick={() => setActiveModal("profile")}
          variant="soft"
        >
          Editar
        </Button>
        {activeModal === "profile" ? (
          <AccountModal
            idPrefix="family-account-profile"
            onClose={() => setActiveModal(null)}
            restoreFocusId="family-account-edit"
            title="Editar datos de cuenta"
          >
            <AccountProfileForm
              action={updateAccountAction}
              idPrefix="family-account-profile"
              initialState={profileInitialState}
              name={name}
              phone={phone}
            />
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
          id="family-account-password"
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
          idPrefix="family-account-password-modal"
          onClose={() => setActiveModal(null)}
          restoreFocusId="family-account-password"
          title="Cambiar contraseña"
        >
          <AccountPasswordForm
            action={changePasswordAction}
            idPrefix="family-account-password"
            initialState={passwordInitialState}
          />
        </AccountModal>
      ) : null}
    </>
  );
}
