"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireStaffSession } from "@/composition/auth";
import {
  getKidByIdInRooms,
  getRooms,
  updateKid,
  validateKidForm,
} from "@/application/kid";
import type { Kid } from "@/domain/kid";
import { createKidComposition, getKidAuthorization } from "@/composition/kid";
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
  const session = await requireStaffSession();
  const authorization = await getKidAuthorization(session.user.daycareId, session.user.personId);
  const dependencies = createKidComposition(session.user.daycareId);
  const currentKid = await getKidByIdInRooms(
    dependencies,
    id,
    authorization.assignedRoomIds,
  );
  if (!currentKid) notFound();

  const rooms = (await getRooms(dependencies)).filter((room) =>
    authorization.assignedRoomIds.includes(room.id),
  );
  if (!authorization.roles.includes("teacher") || rooms.length === 0) notFound();
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
    return { errors: validation.errors, message: "" };
  }

  let kid: Kid | null;

  try {
    kid = await updateKid(dependencies, id, validation.data);
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
