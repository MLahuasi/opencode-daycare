import { notFound } from "next/navigation";
import { requireStaffSession } from "@/composition/auth";
import { getKidBySlugInRooms } from "@/application/kid";
import { createKidComposition, getKidAuthorization } from "@/composition/kid";
import { InviteParentForm } from "./_components";

/**
 * Renders the protected invitation page for a kid resolved from its slug.
 *
 * @param props - Dynamic route parameters.
 * @param props.params - Promise containing the requested kid slug.
 * @returns The invitation form or the route's not-found boundary.
 */
export default async function InviteParentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireStaffSession();
  const authorization = await getKidAuthorization(session.user.daycareId, session.user.personId);

  const { slug } = await params;
  const kid = await getKidBySlugInRooms(
    createKidComposition(session.user.daycareId),
    slug,
    authorization.assignedRoomIds,
  );

  if (!kid) {
    notFound();
  }

  return <InviteParentForm kid={{ id: kid.id, name: kid.name, slug: kid.slug }} />;
}
