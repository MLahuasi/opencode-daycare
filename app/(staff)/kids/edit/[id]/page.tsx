import { KidForm } from "../../_components/kid-form";
import type { KidFormValues } from "@/src/application/kid";
import { getKidById, getRooms } from "@/src/application/kid";
import { createKidComposition } from "@/src/composition/kid";
import { updateKidAction } from "../../_actions";
import { requireStaffSession } from "@/auth";
import { notFound } from "next/navigation";

/**
 * Renders the Edit Kid route using the kid identifier.
 *
 * @param props - Dynamic Edit route parameters.
 * @param props.params - Promise containing the kid identifier.
 * @returns The populated kid form or the route's not-found boundary.
 */
export default async function EditKidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaffSession();

  const { id } = await params;
  const dependencies = createKidComposition();
  const [kid, rooms] = await Promise.all([
    getKidById(dependencies, id),
    getRooms(dependencies),
  ]);

  if (!kid) {
    notFound();
  }

  const initialValues: KidFormValues = {
    name: kid.name,
    birthDate: kid.birthDate,
    roomId: kid.roomId,
    allergies: kid.allergies,
    medicalNotes: kid.medicalNotes,
  };
  const updateAction = updateKidAction.bind(null, kid.id);

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <KidForm
        action={updateAction}
        cancelHref={`/kids/${kid.slug}`}
        heading="Editar niño"
        initialValues={initialValues}
        rooms={rooms}
      />
    </main>
  );
}
