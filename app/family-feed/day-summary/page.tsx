import { redirect } from "next/navigation";

/**
 * Keeps the future day-summary destination available without implementing it.
 *
 * @returns Never returns because the route redirects to the family feed.
 */
export default function FamilyDaySummaryPlaceholder() {
  redirect("/family-feed");
}
