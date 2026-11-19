"use server";

import { revalidatePath } from "next/cache";
import { normalizePhone } from "@/domain/person";
import { requireStaffSession } from "@/composition/auth";
import { createStaffAccountComposition } from "@/composition/staff";

export type StaffAccountActionState = {
  errors: { name?: string; phone?: string };
  message: string;
};

/** Validates and persists the authenticated staff member's editable profile. */
export async function updateStaffAccountAction(
  _previousState: StaffAccountActionState,
  formData: FormData,
): Promise<StaffAccountActionState> {
  const session = await requireStaffSession();
  const name = String(formData.get("name") ?? "").trim();
  const rawPhone = String(formData.get("phone") ?? "");
  const errors: StaffAccountActionState["errors"] = {};

  if (name.length < 2) errors.name = "Escribe un nombre válido.";

  const phone = normalizePhone(rawPhone);
  if (rawPhone.trim() && phone === null) {
    errors.phone = "Escribe un teléfono válido, por ejemplo +34 600 123 456.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Revisa los campos marcados." };
  }

  try {
    await createStaffAccountComposition().updateProfile(
      session.user.daycareId,
      session.user.personId,
      { name, phone },
    );
  } catch {
    return {
      errors: {},
      message: "No pudimos guardar los cambios. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/account");
  revalidatePath("/home");
  revalidatePath("/kids");

  return { errors: {}, message: "Tus datos se actualizaron correctamente." };
}
