"use server";

import {
  changePassword,
  InvalidChangePasswordError,
  MissingCredentialError,
} from "@/application/auth";
import { createAuthComposition, requireActiveSession } from "@/composition/auth";

/** Validation feedback returned by the password change action. */
export type PasswordActionState = {
  errors: {
    password?: string;
    confirmation?: string;
  };
  message: string;
};

/**
 * Changes the authenticated user's password while preserving the active session.
 *
 * @param _previousState - Previous form feedback required by the action contract.
 * @param formData - Replacement password and confirmation submitted by the form.
 * @returns Validation or persistence feedback for the password form.
 */
export async function changePasswordAction(
  _previousState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const session = await requireActiveSession();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const errors: PasswordActionState["errors"] = {};

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
        errors: {
          password: "La contraseña debe tener al menos 8 caracteres.",
        },
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

  return {
    errors: {},
    message: "Tu contraseña se cambió correctamente.",
  };
}
