import { KidForm } from "@/app/features/kids";
import type { KidFormValues } from "@/app/features/kids";
import { getKidById, getRooms } from "@/app/features/kids/services";
import { notFound } from "next/navigation";

/**
 * Renders the Edit Kid route using the identifier carried by the shared dynamic segment.
 *
 * @param props - Dynamic Edit route parameters.
 * @param props.params - Promise containing the kid identifier under the shared segment name.
 * @returns The populated kid form or the route's not-found boundary.
 */
export default async function EditKidPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: id } = await params;
  const [kid, rooms] = await Promise.all([getKidById(id), getRooms()]);

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

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <KidForm
        cancelHref={`/kids/${kid.slug}`}
        heading="Editar niño"
        initialValues={initialValues}
        rooms={rooms}
      />
    </main>
  );
}
