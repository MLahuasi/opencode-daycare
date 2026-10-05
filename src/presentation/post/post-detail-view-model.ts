import type { PostDetail } from "@/application/post";

/** Comment formatted for the Post detail view. */
export type PostDetailCommentViewModel = PostDetail["comments"][number] & {
  timeLabel: string;
};

/** Post detail data formatted for visual rendering. */
export type PostDetailViewModel = Omit<
  PostDetail,
  "authorRoleLabel" | "comments" | "createdAtLabel" | "recipient"
> & {
  authorRoleLabel: string;
  comments: readonly PostDetailCommentViewModel[];
  createdAtLabel: string;
  recipient: {
    id: string;
    label: string;
    kind: "kid" | "room";
  };
};

const guayaquilDateTime = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Guayaquil",
});

const guayaquilTime = new Intl.DateTimeFormat("es-EC", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
});

/**
 * Formats neutral Post detail data for the visual detail component.
 *
 * @param detail - Authorized neutral Post detail projection.
 * @returns A localized Post detail view model.
 */
export function presentPostDetail(detail: PostDetail): PostDetailViewModel {
  return {
    ...detail,
    authorRoleLabel: detail.author.role === "personal" ? "maestra" : "familia",
    comments: detail.comments.map((comment) => ({
      ...comment,
      timeLabel: guayaquilTime.format(new Date(comment.createdAt)),
    })),
    createdAtLabel: guayaquilDateTime.format(new Date(detail.post.createdAt)),
    recipient: {
      id: detail.recipient.id,
      kind: detail.recipient.kind,
      label:
        detail.recipient.kind === "kid"
          ? `familia de ${detail.recipient.name}`
          : `sala ${detail.recipient.name}`,
    },
  };
}
