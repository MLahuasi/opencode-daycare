import { KidForm } from "@/app/features/kids";
import type { KidFormValues } from "@/app/features/kids";
import { createKidAction } from "@/app/features/kids/actions";
import { getRooms } from "@/app/features/kids/services";

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
  const rooms = await getRooms();

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <KidForm
        action={createKidAction}
        cancelHref="/kids"
        heading="Agregar niño"
        initialValues={EMPTY_KID_FORM_VALUES}
        rooms={rooms}
      />
    </main>
  );
}
