"use server";

import { revalidatePath } from "next/cache";
import { getSessionPersonRoles, requireActiveSession } from "@/composition/auth";
import { createFamilyComposition } from "@/composition/family";
import { hasPersonRole, normalizePhone } from "@/domain/person";

/** Validation feedback returned by the family account update action. */
export type AccountActionState = {
  errors: {
    name?: string;
    phone?: string;
  };
  message: string;
};

/**
 * Updates the authenticated parent's name and optional phone number.
 *
 * @param _previousState - Previous form feedback required by the action contract.
 * @param formData - Name and phone submitted by the account form.
 * @returns Validation or persistence feedback for the account form.
 */
export async function updateAccountAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await requireActiveSession();
  const roles = await getSessionPersonRoles(
    session.user.daycareId,
    session.user.personId,
  );

  if (!hasPersonRole(roles, "parent")) {
    return {
      errors: {},
      message: "No tienes permiso para modificar esta cuenta.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const rawPhone = String(formData.get("phone") ?? "");
  const errors: AccountActionState["errors"] = {};

  if (name.length < 2) {
    errors.name = "Escribe un nombre válido.";
  }

  const phone = normalizePhone(rawPhone);
  if (rawPhone.trim() && phone === null) {
    errors.phone = "Escribe un teléfono válido, por ejemplo +34 600 123 456.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Revisa los campos marcados." };
  }

  const dependencies = createFamilyComposition(session.user.daycareId);
  const person = await dependencies.people.findById(session.user.personId);

  if (!person || !hasPersonRole(person.roles, "parent")) {
    return {
      errors: {},
      message: "No pudimos encontrar tu cuenta familiar.",
    };
  }

  try {
    await dependencies.people.update({
      ...person,
      name,
      phone,
    });
  } catch {
    return {
      errors: {},
      message: "No pudimos guardar los cambios. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/family-feed/account");
  revalidatePath("/family-feed");

  return {
    errors: {},
    message: "Tus datos se actualizaron correctamente.",
  };
}
