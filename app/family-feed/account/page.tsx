import { redirect } from "next/navigation";

/**
 * Keeps the future family-account destination available without implementing it.
 *
 * @returns Never returns because the route redirects to the family feed.
 */
export default function FamilyAccountPlaceholder() {
  redirect("/family-feed");
}
