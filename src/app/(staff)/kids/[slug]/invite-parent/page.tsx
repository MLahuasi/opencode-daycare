import { notFound } from "next/navigation";
import { requireStaffSession } from "@/auth";
import { getKidBySlug } from "@/application/kid";
import { createKidComposition } from "@/composition/kid";
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
  await requireStaffSession();

  const { slug } = await params;
  const kid = await getKidBySlug(createKidComposition(), slug);

  if (!kid) {
    notFound();
  }

  return <InviteParentForm kid={{ id: kid.id, name: kid.name, slug: kid.slug }} />;
}
