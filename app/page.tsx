import { FeedContent } from "@/app/features/feed";
import { StaffSidebar } from "@/app/features/layout";

/**
 * Renders the static staff feed home page.
 *
 * @returns The responsive staff feed layout.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen bg-[var(--color-page)]">
      <StaffSidebar />
      <FeedContent />
    </div>
  );
}
