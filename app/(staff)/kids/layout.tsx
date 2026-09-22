import { StaffSidebar } from "@/app/components/layout";
import { staffNavigationConfig } from "@/app/shared/config";
import type { ReactNode } from "react";

/**
 * Renders the shared responsive shell for the Kids routes.
 *
 * @param props - Nested Kids route content.
 * @param props.children - Page or not-found content rendered beside the staff navigation.
 * @returns The Kids layout with desktop and mobile staff navigation.
 */
export default function KidsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-page)]">
      <StaffSidebar activeSection="children" navigation={staffNavigationConfig} />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
    </div>
  );
}
