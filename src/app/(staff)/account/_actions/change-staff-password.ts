"use server";

import {
  changePassword,
  InvalidChangePasswordError,
  MissingCredentialError,
} from "@/application/auth";
import { createAuthComposition, requireStaffSession } from "@/composition/auth";

export type StaffPasswordActionState = {
  errors: { password?: string; confirmation?: string };
  message: string;
};

/** Changes the password while preserving the authenticated staff session. */
export async function changeStaffPasswordAction(
  _previousState: StaffPasswordActionState,
  formData: FormData,
): Promise<StaffPasswordActionState> {
  const session = await requireStaffSession();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const errors: StaffPasswordActionState["errors"] = {};

  if (password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  }
  if (password !== confirmation) {
    errors.confirmation = "Las contraseñas no coinciden.";
  }
  if (Object.keys(errors).length > 0) {
    return { errors, message: "Revisa los campos marcados." };
  }

  try {
    await changePassword(createAuthComposition(), {
      daycareId: session.user.daycareId,
      personId: session.user.personId,
      password,
    });
  } catch (error) {
    if (error instanceof InvalidChangePasswordError) {
      return {
        errors: { password: "La contraseña debe tener al menos 8 caracteres." },
        message: "",
      };
    }
    if (error instanceof MissingCredentialError) {
      return {
        errors: {},
        message: "Esta cuenta todavía no tiene una contraseña configurada.",
      };
    }
    return {
      errors: {},
      message: "No pudimos cambiar la contraseña. Inténtalo nuevamente.",
    };
  }

  return { errors: {}, message: "Tu contraseña se cambió correctamente." };
}
