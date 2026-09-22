"use server";

import { requireStaffSession } from "@/auth";
import { validateLinkParentForm } from "../schemas";
import type { LinkParentActionState } from "./types";

/**
 * Validates the parent-link invitation fields on the server.
 *
 * @param _previousState - Previous feedback required by the React action contract.
 * @param formData - Submitted parent-link form payload.
 * @returns Validation feedback until invitation persistence is implemented.
 */
export async function sendParentInvitationAction(
  _previousState: LinkParentActionState,
  formData: FormData,
): Promise<LinkParentActionState> {
  await requireStaffSession();

  const validation = validateLinkParentForm({
    name: formData.get("name"),
    email: formData.get("email"),
    relationship: formData.get("relationship"),
  });

  if (!validation.success) {
    return {
      errors: validation.errors,
      message: "",
    };
  }

  if (typeof formData.get("kidId") !== "string" || !formData.get("kidId")) {
    return {
      errors: {},
      message: "No pudimos identificar al niño. Inténtalo nuevamente.",
    };
  }

  return {
    errors: {},
    message: "",
  };
}
