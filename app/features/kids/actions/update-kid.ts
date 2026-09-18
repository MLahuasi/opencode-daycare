"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateKidForm } from "../schemas";
import { getRooms, updateKid } from "../services";
import type { Kid } from "../types";
import type { KidFormActionState } from "./types";

/**
 * Validates, persists and redirects after updating a kid.
 *
 * @param id - Stable identifier of the kid to update.
 * @param _previousState - Previous feedback required by the React action contract.
 * @param formData - Submitted Edit form payload.
 * @returns Validation or persistence feedback when the update cannot complete.
 */
export async function updateKidAction(
  id: string,
  _previousState: KidFormActionState,
  formData: FormData,
): Promise<KidFormActionState> {
  const rooms = await getRooms();
  const validation = validateKidForm(
    {
      name: formData.get("name"),
      birthDate: formData.get("birthDate"),
      roomId: formData.get("roomId"),
      allergies: formData.get("allergies"),
      medicalNotes: formData.get("medicalNotes"),
    },
    rooms,
  );

  if (!validation.success) {
    return {
      errors: validation.errors,
      message: "",
    };
  }

  let kid: Kid | null;

  try {
    kid = await updateKid(id, validation.data);
  } catch {
    return {
      errors: {},
      message: "No pudimos guardar los cambios. Inténtalo nuevamente.",
    };
  }

  if (!kid) {
    return {
      errors: {},
      message: "No pudimos encontrar el niño que intentas actualizar.",
    };
  }

  revalidatePath("/kids");
  revalidatePath(`/kids/${kid.slug}`);
  redirect(`/kids/${kid.slug}`);
}
