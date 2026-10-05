import { Avatar, CameraIcon, LinkButton } from "@/src/presentation/ui";
import type { Post } from "@/src/domain/post";
import { FeedPostCard, presentFeedPost } from "@/src/presentation/post";
import styles from "./feed-content.module.css";

/** Visual copy shown by the staff feed header. */
export type FeedOverviewViewModel = {
  roomLabel: string;
  greeting: string;
  attendance: string;
  date: string;
  composerPrompt: string;
  publishedTodayLabel: string;
};

/** Props accepted by the staff feed content component. */
type FeedContentProps = {
  /** Whether the current viewer can react to Posts. */
  canReact?: boolean;
  /** Optional classes applied to the feed landmark. */
  className?: string;
  /** Optional destination builder for comment creation. */
  commentHref?: (postId: string) => string;
  /** Server action used to toggle a reaction. */
  onToggleReaction?: (
    postId: string,
  ) => Promise<{ success: boolean; active?: boolean; message?: string }>;
  /** Room header, greeting and composer copy. */
  overview: FeedOverviewViewModel;
  /** Published Posts to render as cards. */
  posts: readonly Post[];
};

/**
 * Renders the static Sala Soles staff feed.
 *
 * @param props - Feed content configuration.
 * @param props.className - Optional classes applied to the feed landmark.
 * @param props.canReact - Whether the current viewer can react to posts.
 * @param props.commentHref - Optional destination builder for comment creation.
 * @param props.onToggleReaction - Server action used to toggle a reaction.
 * @param props.overview - Room header, greeting, and composer copy.
 * @param props.posts - Published posts to render as cards.
 * @returns The feed main landmark with the greeting, composer, and posts.
 */
export function FeedContent({
  canReact = false,
  className = "",
  commentHref,
  onToggleReaction,
  overview,
  posts,
}: FeedContentProps) {
  return (
    <main className={`${styles.feed} ${className}`}>
      <div className={styles.container}>
        <header className={styles.greeting}>
          <p>{overview.roomLabel}</p>
          <h1>{overview.greeting}</h1>
          <span>{overview.attendance} · {overview.date}</span>
        </header>

        <LinkButton className={styles.composer} href="/posts/new" variant="ghost">
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
            <FeedPostCard
              canReact={canReact}
              commentHref={commentHref?.(post.id)}
              key={post.id}
              onToggleReaction={onToggleReaction}
              post={presentFeedPost(post)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
