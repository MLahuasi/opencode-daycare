"use client";

import { useActionState, useState } from "react";
import { CheckboxField } from "@/presentation/ui";
import {
  updatePhotoConsentAction,
  type PhotoConsentActionState,
} from "../_actions/update-photo-consent";
import styles from "../account.module.css";

const initialState: PhotoConsentActionState = { message: "" };

type PhotoConsentControlProps = {
  checked: boolean;
  kidName: string;
  kidId: string;
};

/**
 * Renders the per-child photo consent switch and submits changes immediately.
 *
 * @param props - Child relationship identifier and persisted consent state.
 * @param props.checked - Current consent loaded from persistence.
 * @param props.kidId - Stable child identifier sent to the server action.
 * @returns An interactive photo consent form.
 */
export function PhotoConsentControl({
  checked: initialChecked,
  kidName,
  kidId,
}: PhotoConsentControlProps) {
  const [state, formAction, isPending] = useActionState(
    updatePhotoConsentAction,
    initialState,
  );
  const [checked, setChecked] = useState(initialChecked);

  return (
    <form action={formAction} className={styles.photoControlForm}>
      <input name="kidId" type="hidden" value={kidId} />
      <CheckboxField
        aria-label={`Permitir fotos de ${kidName}`}
        checked={checked}
        className={styles.photoControl}
        disabled={isPending}
        indicatorClassName={styles.switch}
        label="Fotos"
        name="enabled"
        onChange={(event) => {
          setChecked(event.currentTarget.checked);
          event.currentTarget.form?.requestSubmit();
        }}
        value="true"
      />
      {state.message ? (
        <span className={styles.photoControlStatus} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
