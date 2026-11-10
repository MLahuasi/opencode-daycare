import { KidForm } from "../_components/kid-form";
import type { KidFormValues } from "@/application/kid";
import { getRooms } from "@/application/kid";
import { createKidComposition, getKidAuthorization } from "@/composition/kid";
import { createKidAction } from "../_actions";
import { requireStaffSession } from "@/composition/auth";
import { notFound } from "next/navigation";

const EMPTY_KID_FORM_VALUES: KidFormValues = {
  name: "",
  birthDate: "",
  roomId: "",
  allergies: "",
  medicalNotes: "",
};

/**
 * Renders the Add Kid route with empty editable values and available rooms.
 *
 * @returns The new kid form configured to cancel back to the Kids list.
 */
export default async function NewKidPage() {
  const session = await requireStaffSession();
  const authorization = await getKidAuthorization(session.user.daycareId, session.user.personId);

  const rooms = await getRooms(createKidComposition(session.user.daycareId));
  const authorizedRooms = rooms.filter((room) => authorization.assignedRoomIds.includes(room.id));
  if (!authorization.roles.includes("teacher") || authorizedRooms.length === 0) notFound();

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <KidForm
        action={createKidAction}
        cancelHref="/kids"
        heading="Agregar niño"
        initialValues={EMPTY_KID_FORM_VALUES}
        rooms={authorizedRooms}
      />
    </main>
  );
}
