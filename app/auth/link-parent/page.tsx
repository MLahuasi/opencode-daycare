import { notFound } from "next/navigation";
import { requireStaffSession } from "@/auth";
import { LinkParentForm } from "@/app/features/auth/components";
import { getLinkParentKid } from "@/app/features/auth/server";

type LinkParentSearchParams = {
  kidId?: string | string[];
};

/**
 * Renders the parent-link invitation page for a persisted kid.
 *
 * @param props - Route search parameters.
 * @param props.searchParams - Promise containing the requested kid identifier.
 * @returns The parent-link invitation page or the not-found boundary.
 */
export default async function LinkParentPage({
  searchParams,
}: {
  searchParams: Promise<LinkParentSearchParams>;
}) {
  await requireStaffSession();

  const params = await searchParams;
  const rawKidId = params.kidId;
  const kidId = Array.isArray(rawKidId) ? rawKidId[0] : rawKidId;

  if (!kidId) {
    notFound();
  }

  const kid = await getLinkParentKid(kidId);

  if (!kid) {
    notFound();
  }

  return <LinkParentForm kid={kid} />;
}
