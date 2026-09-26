import { StaffSidebar } from "@/app/components/layout";
import { staffNavigationConfig } from "@/app/shared/config";
import { requireStaffSession } from "@/auth";
import type { ReactNode } from "react";

/**
 * Renders the shared staff shell for post creation and editing.
 *
 * @param props - Nested post route content.
 * @param props.children - Post form rendered beside the staff navigation.
 * @returns The post route with stable staff navigation.
 */
export default async function PostLayout({ children }: { children: ReactNode }) {
  await requireStaffSession();

  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar navigation={staffNavigationConfig} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
