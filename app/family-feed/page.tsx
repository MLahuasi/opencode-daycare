import { redirect } from "next/navigation";
import { FamilyFeedContent, FamilySidebar } from "@/app/features/family";
import {
  getAuthenticatedFamilyContext,
  getFamilyFeed,
  getFamilyFeedOptions,
} from "@/app/features/family/server";
import type { FamilyFeedFilter } from "@/app/features/family";
import { requireActiveSession } from "@/auth";
import styles from "./family-feed.module.css";

/**
 * Renders the authenticated family feed outside the staff home route.
 *
 * @returns The family feed shell and authorized posts.
 */
export default async function FamilyFeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string | string[]; id?: string | string[] }>;
}) {
  const session = await requireActiveSession();

  if (session.user.role !== "parent") {
    redirect("/home");
  }

  const [familyContext, options] = await Promise.all([
    getAuthenticatedFamilyContext(),
    getFamilyFeedOptions(),
  ]);
  const params = await searchParams;
  const filterKind = Array.isArray(params?.filter)
    ? params.filter[0]
    : params?.filter;
  const filterId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const roomOptions = options.filter((option) => option.filter.kind === "room");
  const defaultFilter: FamilyFeedFilter =
    roomOptions.length === 1 ? roomOptions[0].filter : { kind: "all" };
  const selectedFilter =
    options.find((option) =>
      option.filter.kind === "all"
        ? filterKind === "all"
        : option.filter.kind === filterKind && option.filter.id === filterId,
    )?.filter ?? defaultFilter;
  const familyPosts = await getFamilyFeed(selectedFilter);

  return (
    <div className={styles.shell}>
      <FamilySidebar person={familyContext.person} />
      <div className={styles.content}>
        <FamilyFeedContent
          options={options}
          person={familyContext.person}
          posts={familyPosts}
          selectedFilter={selectedFilter}
        />
      </div>
    </div>
  );
}
