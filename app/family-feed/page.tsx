import { redirect } from "next/navigation";
import { FamilyFeedContent, FamilyHeader, FamilyNavigation } from "@/app/features/family";
import {
  getAuthenticatedFamilyContext,
  getFamilyFeed,
} from "@/app/features/family/server";
import { familyNavigationConfig } from "@/app/shared/config";
import { requireActiveSession } from "@/auth";

/**
 * Renders the authenticated family feed outside the staff home route.
 *
 * @returns The family feed shell and authorized posts.
 */
export default async function FamilyFeedPage() {
  const session = await requireActiveSession();

  if (session.user.role !== "parent") {
    redirect("/home");
  }

  const [familyContext, familyPosts] = await Promise.all([
    getAuthenticatedFamilyContext(),
    getFamilyFeed(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <FamilyHeader kids={familyContext.kids} person={familyContext.person} />
      <FamilyNavigation navigation={familyNavigationConfig} />
      <FamilyFeedContent posts={familyPosts} />
    </div>
  );
}
