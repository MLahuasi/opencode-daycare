import type { Post } from "@/domain/post";
import { FeedPostCard, presentFeedPost } from "@/presentation/post";
import { toggleFeedReactionAction } from "@/app/_actions/posts";
import type { Person } from "@/domain/person";
import type { FamilyFeedFilter } from "@/domain/family/feed";
import type { FamilyFeedOption } from "@/presentation/family";
import { FamilyFeedFilters } from "./family-feed-filters";
import styles from "./family-feed-content.module.css";

/**
 * Formats the current date for the family feed divider.
 *
 * @returns The localized uppercase date label.
 */
function formatToday(): string {
  const parts = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("weekday")} ${values.get("day")} ${values.get("month")}`.toUpperCase();
}

/**
 * Extracts the first visible name segment.
 *
 * @param name - Full person name.
 * @returns The first name segment.
 */
function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Props accepted by the family feed content component. */
type FamilyFeedContentProps = {
  /** Optional classes applied to the feed landmark. */
  className?: string;
  /** Server-authorized feed filter options. */
  options: readonly FamilyFeedOption[];
  /** Parent identity displayed in the greeting. */
  person: Pick<Person, "name">;
  /** Authorized Posts to render as cards. */
  posts: readonly Post[];
  /** Filter currently applied to the feed. */
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
              <FeedPostCard
                canEdit={false}
                canReact
                commentHref={`/posts/${encodeURIComponent(post.id)}/comments/new`}
                key={post.id}
                onToggleReaction={toggleFeedReactionAction}
                post={presentFeedPost(post)}
              />
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
