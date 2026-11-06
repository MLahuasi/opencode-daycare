import type { Post } from "@/domain/post";
import {
  FeedPostCard,
  getKidAvatarPositions,
  presentFeedPost,
} from "@/presentation/post";
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
function formatToday(locale: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone,
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("weekday")} ${values.get("day")} ${values.get("month")}`.toUpperCase();
}

function getLocalDateKey(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(value);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
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
  /** IANA time zone used to render dates and post timestamps. */
  timeZone: string;
  /** Locale used to render dates and post timestamps. */
  locale: string;
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
  timeZone,
  locale,
}: FamilyFeedContentProps) {
  const kidAvatarPositions = getKidAvatarPositions(posts);
  const todayKey = getLocalDateKey(new Date(), timeZone);
  const todayPosts = posts.filter(
    (post) => getLocalDateKey(new Date(post.createdAt), timeZone) === todayKey,
  );
  const previousPosts = posts.filter(
    (post) => getLocalDateKey(new Date(post.createdAt), timeZone) !== todayKey,
  );

  function renderPosts(group: readonly Post[]) {
    return (
      <div className={styles.posts}>
        {group.map((post) => (
          <FeedPostCard
            canEdit={false}
            canReact
            commentHref={`/posts/${encodeURIComponent(post.id)}/comments/new`}
            kidAvatarPosition={kidAvatarPositions.get(post.id)}
            key={post.id}
            onToggleReaction={toggleFeedReactionAction}
            post={presentFeedPost(post, locale, timeZone)}
          />
        ))}
      </div>
    );
  }

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

        {todayPosts.length > 0 ? (
          <>
            <div className={styles.dateDivider}>
              <span>HOY - {formatToday(locale, timeZone)}</span>
              <i aria-hidden="true" />
            </div>
            {renderPosts(todayPosts)}
          </>
        ) : null}

        {previousPosts.length > 0 ? (
          <>
            <div className={`${styles.dateDivider} ${styles.previousDivider}`}>
              <span>ANTERIORES</span>
              <i aria-hidden="true" />
            </div>
            {renderPosts(previousPosts)}
          </>
        ) : null}

        {posts.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <h2>Aún no hay novedades para mostrar</h2>
            <p>
              Cuando exista una relación familiar activa, las actualizaciones
              autorizadas aparecerán aquí.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
