"use server";

import { requireStaffSession } from "@/composition/auth";
import { redirect } from "next/navigation";
import { validateInviteParentForm } from "../_schemas";
import {
  createInvitation,
  ExistingInvitationParentKidError,
  ExistingInvitationPersonError,
} from "@/application/family";
import { getKidBySlug } from "@/application/kid";
import { createKidComposition } from "@/composition/kid";
import { createFamilyComposition } from "@/composition/family";
import { getApplicationEnvironment } from "@/config/server";
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
  const session = await requireStaffSession();

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

  const dependencies = createFamilyComposition(session.user.daycareId);
  const kid = await getKidBySlug(createKidComposition(session.user.daycareId), rawSlug);

  if (!kid) {
    return {
      errors: {},
      message: "No pudimos encontrar al niño.",
    };
  }

  if (kid.daycareId !== session.user.daycareId) {
    return {
      errors: {},
      message: "No puedes crear una invitación para otra guardería.",
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
      console.warn("[invite-parent] invitation rejected", {
        reason: "existing-person-is-not-parent",
      });
      return {
        errors: {
          email:
            "Este correo tiene un perfil pendiente de activación y no puede recibir otra invitación. Completa la activación o solicita limpiar el perfil pendiente.",
        },
        message:
          "El correo tiene un perfil pendiente de activación y no puede recibir otra invitación.",
      };
    }

    if (error instanceof ExistingInvitationParentKidError) {
      console.warn("[invite-parent] invitation rejected", {
        reason: "parent-kid-link-already-exists",
      });
      return {
        errors: { email: "Esta persona ya está vinculada con este niño." },
        message: "Revisa los campos marcados.",
      };
    }

    const persistenceError = error as {
      code?: unknown;
      name?: unknown;
    };
    console.error("[invite-parent] invitation creation failed", {
      code: typeof persistenceError.code === "string" ? persistenceError.code : undefined,
      name: typeof persistenceError.name === "string" ? persistenceError.name : "UnknownError",
    });

    return {
      errors: {},
      message: "No pudimos crear la invitación. Inténtalo nuevamente.",
    };
  }

  const { appUrl } = getApplicationEnvironment();
  const invitationUrl = new URL(
    `/auth/parent-invitation/${createdInvitation.invitation.code}`,
    appUrl,
  );
  invitationUrl.searchParams.set("daycareId", createdInvitation.invitation.daycareId);

  try {
    await dependencies.mailer.send({
      invitationUrl: invitationUrl.toString(),
      expiresAt: new Date(createdInvitation.invitation.expiresAt),
      kidName: kid.name,
      parentName: createdInvitation.person.name,
      recipientEmail: createdInvitation.person.email,
    });
    await dependencies.invitations.markSent(
      createdInvitation.invitation.id,
      dependencies.clock.now().toISOString(),
    );
  } catch (error) {
    const mailerError = error as {
      code?: unknown;
      name?: unknown;
    };
    console.error("[invite-parent] invitation delivery failed", {
      code: typeof mailerError.code === "string" ? mailerError.code : undefined,
      name: typeof mailerError.name === "string" ? mailerError.name : "UnknownError",
    });
    return {
      errors: {},
      message: "No pudimos enviar la invitación. Puedes intentarlo nuevamente.",
    };
  }

  redirect(`/kids/${kid.slug}?invitation=sent&daycareId=${encodeURIComponent(kid.daycareId)}`);
}
