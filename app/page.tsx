import { FeedContent } from "@/app/features/feed";
import { StaffSidebar } from "@/app/components/layout";
import { staffNavigationConfig } from "@/app/shared/config";

/**
 * Renders the static staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen bg-[var(--color-page)]">
      <StaffSidebar navigation={staffNavigationConfig} />
      <FeedContent />
    </div>
  );
}
