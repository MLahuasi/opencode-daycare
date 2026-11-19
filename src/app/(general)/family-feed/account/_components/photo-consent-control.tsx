"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckboxField } from "@/presentation/ui";
import {
  updatePhotoConsentAction,
  type PhotoConsentActionState,
} from "../_actions/update-photo-consent";
import styles from "../account.module.css";

const initialState: PhotoConsentActionState = { message: "", success: false };

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
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.refreshToken) {
      router.refresh();
    }
  }, [router, state.refreshToken, state.success]);

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
