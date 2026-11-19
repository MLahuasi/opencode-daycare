"use server";

import { revalidatePath } from "next/cache";
import { getSessionPersonRoles, requireActiveSession } from "@/composition/auth";
import { createFamilyComposition } from "@/composition/family";
import { hasPersonRole } from "@/domain/person";

/** Validation and persistence feedback returned by the photo consent action. */
export type PhotoConsentActionState = {
  message: string;
  success: boolean;
  refreshToken?: number;
};

/**
 * Updates photo-sharing consent for one child linked to the authenticated parent.
 *
 * The action changes only the relationship consent. Existing publications are
 * intentionally preserved; the setting is consumed by future photo posts.
 *
 * @param _previousState - Previous feedback required by the form action contract.
 * @param formData - Child identifier and requested consent state.
 * @returns Persistence feedback for the account control.
 */
export async function updatePhotoConsentAction(
  _previousState: PhotoConsentActionState,
  formData: FormData,
): Promise<PhotoConsentActionState> {
  const session = await requireActiveSession();
  const roles = await getSessionPersonRoles(
    session.user.daycareId,
    session.user.personId,
  );

  if (!hasPersonRole(roles, "parent")) {
    return {
      message: "No tienes permiso para modificar este consentimiento.",
      success: false,
    };
  }

  const kidId = String(formData.get("kidId") ?? "").trim();
  const enabledValue = String(formData.get("enabled") ?? "").trim().toLowerCase();

  if (!kidId || (enabledValue && !["true", "false"].includes(enabledValue))) {
    return { message: "La solicitud de consentimiento no es válida.", success: false };
  }

  const enabled = enabledValue === "true";
  const dependencies = createFamilyComposition(session.user.daycareId);
  const relationship = await dependencies.parentKids.findByParentAndKid(
    session.user.personId,
    kidId,
  );

  if (!relationship) {
    return {
      message: "No tienes permiso para modificar este consentimiento.",
      success: false,
    };
  }

  try {
    await dependencies.parentKids.updatePhotoSharingConsent(
      session.user.personId,
      kidId,
      enabled,
    );
  } catch {
    return {
      message: "No pudimos guardar el consentimiento. Inténtalo nuevamente.",
      success: false,
    };
  }

  revalidatePath("/family-feed/account");
  revalidatePath("/family-feed");

  return {
    message: enabled
      ? "Se permitirá publicar fotos futuras de este hijo."
      : "No se permitirán nuevas publicaciones de fotos de este hijo.",
    success: true,
    refreshToken: Date.now(),
  };
}
