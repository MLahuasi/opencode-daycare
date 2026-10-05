import type { Post } from "@/src/domain/post";

/** Post data formatted for the family feed card. */
export type FeedPostViewModel = Post & {
  authorLabel?: string;
  hasMedia: boolean;
  initial: string;
  mediaLabel?: string;
  recipient: string;
  time: string;
};

const feedTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/**
 * Formats a neutral Post for the family feed card.
 *
 * @param post - Authorized neutral Post projection.
 * @returns The visual feed card model.
 */
export function presentFeedPost(post: Post): FeedPostViewModel {
  return {
    ...post,
    authorLabel: "publicado por ti",
    hasMedia: post.media.length > 0,
    initial: post.subject.trim().charAt(0).toUpperCase(),
    mediaLabel: post.media[0]?.alt ?? post.media[0]?.originalName,
    recipient: post.kidId ? `familia de ${post.subject}` : "toda la sala",
    time: feedTimeFormatter.format(new Date(post.dateTime)),
  };
}
