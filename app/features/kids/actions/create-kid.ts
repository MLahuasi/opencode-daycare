"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateKidForm } from "../schemas";
import { createKid, getRooms } from "../services";
import type { Kid } from "../types";
import type { KidFormActionState } from "./types";

/**
 * Validates, persists and redirects after creating a kid.
 *
 * @param _previousState - Previous feedback required by the React action contract.
 * @param formData - Submitted Add form payload.
 * @returns Validation or persistence feedback when creation cannot complete.
 */
export async function createKidAction(
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

  let kid: Kid;

  try {
    kid = await createKid(validation.data);
  } catch {
    return {
      errors: {},
      message: "No pudimos guardar el niño. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/kids");
  revalidatePath(`/kids/${kid.slug}`);
  redirect(`/kids/${kid.slug}`);
}
