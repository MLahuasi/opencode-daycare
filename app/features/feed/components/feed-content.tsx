import { Avatar, CameraIcon, LinkButton } from "@/app/components/ui";
import type { FeedOverview, FeedPost } from "../types";
import { FeedPostCard } from "./feed-post-card";
import styles from "./feed-content.module.css";

type FeedContentProps = {
  className?: string;
  overview: FeedOverview;
  posts: readonly FeedPost[];
};

/**
 * Renders the decorative camera icon for the post composer.
 *
 * @returns An inline SVG camera icon.
 */
/**
 * Renders the static Sala Soles staff feed.
 *
 * @param props - Feed content configuration.
 * @param props.className - Optional classes applied to the feed landmark.
 * @param props.overview - Room header, greeting, and composer copy.
 * @param props.posts - Published posts to render as cards.
 * @returns The feed main landmark with the greeting, composer, and posts.
 */
export function FeedContent({ className = "", overview, posts }: FeedContentProps) {
  return (
    <main className={`${styles.feed} ${className}`}>
      <div className={styles.container}>
        <header className={styles.greeting}>
          <p>{overview.roomLabel}</p>
          <h1>{overview.greeting}</h1>
          <span>{overview.attendance} · {overview.date}</span>
        </header>

        <LinkButton className={styles.composer} href="/post" variant="ghost">
          <Avatar aria-hidden="true" className={styles.avatar} initial="C" />
          <span className={styles.composerText}>{overview.composerPrompt}</span>
          <span className={styles.camera} aria-hidden="true">
            <CameraIcon />
          </span>
        </LinkButton>

        <div className={styles.divider}>
          <span>{overview.publishedTodayLabel}</span>
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
