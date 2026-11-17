import { StaffSidebar } from "@/presentation/layout";
import { createStaffNavigationConfig } from "@/presentation/navigation";
import { createStaffShellComposition } from "@/composition/staff";
import { requireTeacherSession } from "@/composition/auth";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the shared responsive shell for the Kids routes.
 *
 * @param props - Nested Kids route content.
 * @param props.children - Page or not-found content rendered beside the staff navigation.
 * @returns The Kids layout with desktop and mobile staff navigation.
 */
export default async function KidsLayout({ children }: { children: ReactNode }) {
  const session = await requireTeacherSession();
  const staffNavigation = await createStaffShellComposition().getNavigation(
    session.user.daycareId,
    session.user.personId,
  );

  if (!staffNavigation) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar
        activeSection="children"
        navigation={createStaffNavigationConfig(staffNavigation)}
      />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
    </div>
  );
}
