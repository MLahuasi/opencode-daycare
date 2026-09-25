import type { FeedPost } from "@/app/features/feed";
import { FeedPostCard } from "@/app/features/feed";
import type { Person } from "@/app/features/people";
import type { FamilyFeedFilter, FamilyFeedOption } from "../types";
import { FamilyFeedFilters } from "./family-feed-filters";
import styles from "./family-feed-content.module.css";

function formatToday(): string {
  const parts = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("weekday")} ${values.get("day")} ${values.get("month")}`.toUpperCase();
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

type FamilyFeedContentProps = {
  className?: string;
  options: readonly FamilyFeedOption[];
  person: Pick<Person, "name">;
  posts: readonly FeedPost[];
  selectedFilter: FamilyFeedFilter;
};

/**
 * Renders the server-filtered family feed without staff-only controls.
 *
 * @param props - Family feed content configuration.
 * @param props.className - Optional classes applied to the feed landmark.
 * @param props.options - Server-authorized feed filter options.
 * @param props.person - Parent identity displayed in the greeting.
 * @param props.posts - Authorized posts to render as cards.
 * @param props.selectedFilter - Filter currently applied to the feed.
 * @returns The family feed main landmark.
 */
export function FamilyFeedContent({
  className = "",
  options,
  person,
  posts,
  selectedFilter,
}: FamilyFeedContentProps) {
  return (
    <main className={`${styles.feed} ${className}`}>
      <div className={styles.container}>
        <header className={styles.greeting}>
          <p>Tu familia</p>
          <h1>Hola, {getFirstName(person.name)}</h1>
          <span>Así va el día de hoy</span>
        </header>

        <FamilyFeedFilters
          options={options}
          selectedFilter={selectedFilter}
        />

        <div className={styles.dateDivider}>
          <span>HOY - {formatToday()}</span>
          <i aria-hidden="true" />
        </div>

        {posts.length > 0 ? (
          <div className={styles.posts}>
            {posts.map((post) => (
              <FeedPostCard canEdit={false} key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState} role="status">
            <h2>Aún no hay novedades para mostrar</h2>
            <p>
              Cuando exista una relación familiar activa, las actualizaciones
              autorizadas aparecerán aquí.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
