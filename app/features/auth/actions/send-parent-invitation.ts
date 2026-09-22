"use server";

import { requireStaffSession } from "@/auth";
import { sendParentInvitationEmail } from "@/app/infrastructure";
import { getPeople } from "@/app/features/kids/server";
import { getEnvironment } from "@/app/shared/config/server";
import { validateLinkParentForm } from "../schemas";
import {
  createPendingParentInvitation,
  getLinkParentKid,
  markInvitationSent,
} from "../services";
import type { LinkParentActionState } from "./types";

/**
 * Validates the parent-link invitation fields on the server.
 *
 * @param _previousState - Previous feedback required by the React action contract.
 * @param formData - Submitted parent-link form payload.
 * @returns Validation feedback until invitation delivery is completed.
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

  const people = await getPeople();
  const emailAlreadyExists = people.some(
    (person) => person.email.trim().toLowerCase() === validation.data.email,
  );

  if (emailAlreadyExists) {
    return {
      errors: {
        email: "Ya existe una persona registrada con este email.",
      },
      message: "Revisa los campos marcados.",
    };
  }

  const rawKidId = formData.get("kidId");

  if (typeof rawKidId !== "string" || !rawKidId) {
    return {
      errors: {},
      message: "No pudimos identificar al niño. Inténtalo nuevamente.",
    };
  }

  const kid = await getLinkParentKid(rawKidId);

  if (!kid) {
    return {
      errors: {},
      message: "No pudimos encontrar al niño. Inténtalo nuevamente.",
    };
  }

  let parentInvitation: Awaited<
    ReturnType<typeof createPendingParentInvitation>
  >;
  try {
    parentInvitation = await createPendingParentInvitation({
      name: validation.data.name,
      email: validation.data.email,
      kidId: rawKidId,
      relationship: validation.data.relationship,
    });
  } catch {
    return {
      errors: {},
      message: "No pudimos crear la invitación. Inténtalo nuevamente.",
    };
  }

  const { APP_URL } = getEnvironment();
  const activationUrl = new URL("/auth/activate-account", APP_URL);
  activationUrl.searchParams.set("code", parentInvitation.invitation.code);

  await sendParentInvitationEmail({
    activationLink: activationUrl.toString(),
    expiresAt: new Date(parentInvitation.invitation.expiresAt),
    kidName: kid.name,
    parentName: parentInvitation.parent.name,
    recipientEmail: parentInvitation.parent.email,
  });

  await markInvitationSent(
    parentInvitation.invitation.id,
    new Date().toISOString(),
  );

  return {
    errors: {},
    message: "",
  };
}
