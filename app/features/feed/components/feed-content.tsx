import { Avatar, Button } from "@/app/components/ui";
import { feedOverview, feedPosts } from "@/app/data/mocks";
import { FeedPostCard } from "./feed-post-card";
import styles from "./feed-content.module.css";

type FeedContentProps = {
  className?: string;
};

/**
 * Renders the decorative camera icon for the post composer.
 *
 * @returns An inline SVG camera icon.
 */
function CameraIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/**
 * Renders the static Sala Soles staff feed.
 *
 * @param props - Feed content customization options.
 * @param props.className - Optional classes applied to the feed landmark.
 * @returns The feed main landmark with the greeting, composer, and posts.
 */
export function FeedContent({ className = "" }: FeedContentProps) {
  return (
    <main className={`${styles.feed} ${className}`}>
      <div className={styles.container}>
        <header className={styles.greeting}>
          <p>{feedOverview.roomLabel}</p>
          <h1>{feedOverview.greeting}</h1>
          <span>{feedOverview.attendance} · {feedOverview.date}</span>
        </header>

        <Button className={styles.composer} variant="ghost">
          <Avatar aria-hidden="true" className={styles.avatar} initial="C" />
          <span className={styles.composerText}>{feedOverview.composerPrompt}</span>
          <span className={styles.camera} aria-hidden="true">
            <CameraIcon />
          </span>
        </Button>

        <div className={styles.divider}>
          <span>{feedOverview.publishedTodayLabel}</span>
          <i aria-hidden="true" />
        </div>

        <div className={styles.posts}>
          {feedPosts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}
