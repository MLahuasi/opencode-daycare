import { StaffSidebar } from "@/presentation/layout";
import { requireStaffSession } from "@/composition/auth";
import { getStaffNavigation } from "@/composition/staff-shell";
import { getKidAuthorization } from "@/composition/kid";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the shared responsive shell for the Kids routes.
 *
 * @param props - Nested Kids route content.
 * @param props.children - Page or not-found content rendered beside the staff navigation.
 * @returns The Kids layout with desktop and mobile staff navigation.
 */
export default async function KidsLayout({ children }: { children: ReactNode }) {
  const session = await requireStaffSession();
  const authorization = await getKidAuthorization(session.user.daycareId, session.user.personId);
  if (!authorization.roles.includes("teacher") || authorization.assignedRoomIds.length === 0) {
    notFound();
  }
  const navigation = await getStaffNavigation(
    session.user.daycareId,
    session.user.personId,
  );

  if (!navigation) redirect("/auth/login");

  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar activeSection="children" navigation={navigation} />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
    </div>
  );
}
