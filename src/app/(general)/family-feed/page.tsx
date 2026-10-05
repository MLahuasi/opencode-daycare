import { redirect } from "next/navigation";
import { FamilyFeedContent } from "./_components/family-feed-content";
import {
  getFamilyFeedContext,
  getFamilyFeedProjection,
} from "@/src/application/family/feed";
import {
  type FamilyFeedFilter,
} from "@/src/domain/family/feed";
import { requireActiveSession } from "@/auth";
import { FamilySidebar } from "@/src/presentation/layout";
import { presentFamilyFeedOptions } from "@/src/presentation/family";
import { createFamilyFeedComposition } from "@/src/composition/family";
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

  const dependencies = createFamilyFeedComposition();
  const familyContext = await getFamilyFeedContext(
    dependencies,
    session.user.personId,
  );
  const options = presentFamilyFeedOptions(
    familyContext.activeKids,
    familyContext.rooms,
  );
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
  const familyFeed = await getFamilyFeedProjection(
    dependencies,
    session.user.personId,
    selectedFilter,
  );

  return (
    <div className={styles.shell}>
      <FamilySidebar person={familyFeed.context.person} />
      <div className={styles.content}>
        <FamilyFeedContent
          options={options}
          person={familyFeed.context.person}
          posts={familyFeed.posts}
          selectedFilter={selectedFilter}
        />
      </div>
    </div>
  );
}
