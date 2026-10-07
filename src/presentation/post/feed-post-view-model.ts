import type { Post } from "@/domain/post";

/** Post data formatted for the family feed card. */
export type FeedPostViewModel = Post & {
  authorLabel?: string;
  hasMedia: boolean;
  initial: string;
  mediaLabel?: string;
  recipient: string;
  time: string;
};

export function isChildFeedPost(
  post: Pick<Post, "kidIds" | "type">,
): boolean {
  return post.kidIds.length > 0 && post.type !== "announcement";
}

export function getKidAvatarPositions(
  posts: readonly Post[],
): ReadonlyMap<string, number> {
  const positions = new Map<string, number>();
  let position = 0;

  for (const post of posts) {
    if (isChildFeedPost(post)) {
      positions.set(post.id, position);
      position += 1;
    }
  }

  return positions;
}

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
  const subject = post.subject ?? (post.kidIds.length > 1 ? "Varios niños" : "Anuncio general");

  return {
    ...post,
    authorLabel: "publicado por ti",
    hasMedia: post.media.length > 0,
    initial: subject.trim().charAt(0).toUpperCase(),
    mediaLabel: post.media[0]?.alt ?? post.media[0]?.originalName,
    recipient: post.kidIds.length > 0 ? `familia de ${subject}` : "toda la sala",
    subject,
    time: feedTimeFormatter.format(new Date(post.createdAt)),
  };
}
