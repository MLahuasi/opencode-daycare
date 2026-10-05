"use server";

import { redirect } from "next/navigation";
import { acceptInvitation, InvalidInvitationAcceptanceError } from "@/application/family";
import { createFamilyComposition } from "@/composition/family";
import type { ParentInvitationActionState } from "./types";

/**
 * Accepts a public parent invitation and activates its family relationship.
 *
 * @param _previousState - Previous feedback required by the action contract.
 * @param formData - Token, email, password and consent submitted by the parent.
 * @returns Validation or persistence feedback until acceptance succeeds.
 */
export async function acceptParentInvitationAction(
  _previousState: ParentInvitationActionState,
  formData: FormData,
): Promise<ParentInvitationActionState> {
  const code = String(formData.get("code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");
  const photoSharingConsent = formData.get("photoSharingConsent") === "on";
  const errors: ParentInvitationActionState["errors"] = {};

  if (!email) {
    errors.email = "Ingresa tu email.";
  }

  if (password && password !== passwordConfirmation) {
    errors.passwordConfirmation = "Las contraseñas no coinciden.";
  }

  if (!photoSharingConsent) {
    errors.photoSharingConsent = "Debes aceptar el consentimiento para continuar.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Revisa los campos marcados." };
  }

  try {
    await acceptInvitation(createFamilyComposition(), {
      code,
      email,
      password: password || undefined,
      photoSharingConsent,
    });
  } catch (error) {
    if (error instanceof InvalidInvitationAcceptanceError) {
      return {
        errors: {},
        message: "El enlace de invitación no es válido o ya no está disponible.",
      };
    }

    return {
      errors: {},
      message: "No pudimos activar la cuenta. Inténtalo nuevamente.",
    };
  }

  redirect("/auth/login?activated=1");
}
