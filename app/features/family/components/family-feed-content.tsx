import type { FeedPost } from "@/app/features/feed";
import { FeedPostCard } from "@/app/features/feed";
import styles from "./family-feed-content.module.css";

type FamilyFeedContentProps = {
  className?: string;
  posts: readonly FeedPost[];
};

/**
 * Renders the server-filtered family feed without staff-only controls.
 *
 * @param props - Family feed content configuration.
 * @param props.className - Optional classes applied to the feed landmark.
 * @param props.posts - Authorized posts to render as cards.
 * @returns The family feed main landmark.
 */
export function FamilyFeedContent({
  className = "",
  posts,
}: FamilyFeedContentProps) {
  return (
    <main className={`${styles.feed} ${className}`}>
      <div className={styles.container}>
        <header className={styles.greeting}>
          <p>Novedades familiares</p>
          <h1>Lo que está pasando</h1>
          <span>Actualizaciones de tus niños y sus salas</span>
        </header>

        <div className={styles.divider}>
          <span>Actividad reciente</span>
          <i aria-hidden="true" />
        </div>

        <div className={styles.posts}>
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}
