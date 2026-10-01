"use server";

import { requireStaffSession } from "@/auth";
import { redirect } from "next/navigation";
import { validateInviteParentForm } from "../_schemas";
import { createInvitation, ExistingInvitationPersonError } from "@/src/application/family";
import { getKidBySlug } from "@/src/application/kid";
import { createKidComposition } from "@/src/infrastructure/composition/kid";
import { createFamilyComposition } from "@/src/infrastructure/composition/family";
import { getEnvironment } from "@/src/infrastructure/config/server";
import type { InviteParentActionState } from "./types";

/**
 * Creates and sends a parent invitation for a kid resolved from its slug.
 *
 * @param _previousState - Previous feedback required by the action contract.
 * @param formData - Submitted parent invitation fields and route slug.
 * @returns Validation or delivery feedback until the invitation succeeds.
 */
export async function sendInviteParentAction(
  _previousState: InviteParentActionState,
  formData: FormData,
): Promise<InviteParentActionState> {
  await requireStaffSession();

  const validation = validateInviteParentForm({
    name: formData.get("name"),
    email: formData.get("email"),
    relationship: formData.get("relationship"),
  });

  if (!validation.success) {
    return { errors: validation.errors, message: "" };
  }

  const rawSlug = formData.get("slug");

  if (typeof rawSlug !== "string" || !rawSlug) {
    return {
      errors: {},
      message: "No pudimos identificar el perfil del niño.",
    };
  }

  const dependencies = createFamilyComposition();
  const kid = await getKidBySlug(createKidComposition(), rawSlug);

  if (!kid) {
    return {
      errors: {},
      message: "No pudimos encontrar al niño.",
    };
  }

  let createdInvitation;

  try {
    createdInvitation = await createInvitation(dependencies, {
      name: validation.data.name,
      email: validation.data.email,
      kidId: kid.id,
      relationship: validation.data.relationship,
    });
  } catch (error) {
    if (error instanceof ExistingInvitationPersonError) {
      return {
        errors: { email: "Ya existe una persona registrada con este email." },
        message: "Revisa los campos marcados.",
      };
    }

    return {
      errors: {},
      message: "No pudimos crear la invitación. Inténtalo nuevamente.",
    };
  }

  const { APP_URL } = getEnvironment();
  const invitationUrl = new URL(
    `/auth/parent-invitation/${createdInvitation.invitation.code}`,
    APP_URL,
  ).toString();

  try {
    await dependencies.mailer.send({
      invitationUrl,
      expiresAt: new Date(createdInvitation.invitation.expiresAt),
      kidName: kid.name,
      parentName: createdInvitation.person.name,
      recipientEmail: createdInvitation.person.email,
    });
    await dependencies.invitations.markSent(
      createdInvitation.invitation.id,
      dependencies.clock.now().toISOString(),
    );
  } catch {
    return {
      errors: {},
      message: "No pudimos enviar la invitación. Puedes intentarlo nuevamente.",
    };
  }

  redirect(`/kids/${kid.slug}?invitation=sent`);
}
