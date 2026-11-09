import type { PostDetail } from "@/application/post";
import { createPostDateFormatters } from "@/config";
import { hasRole } from "@/domain/person";

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

/**
 * Formats neutral Post detail data for the visual detail component.
 *
 * @param detail - Authorized neutral Post detail projection.
 * @param timeZone - IANA time zone used to render post and comment times.
 * @returns A localized Post detail view model.
 */
export function presentPostDetail(
  detail: PostDetail,
  locale: string,
  timeZone: string,
): PostDetailViewModel {
  const { dateTime: dateTimeFormatter, time: timeFormatter } =
    createPostDateFormatters(locale, timeZone);

  return {
    ...detail,
    authorRoleLabel: hasRole(detail.author.roles, "personal") ? "maestra" : "familia",
    comments: detail.comments.map((comment) => ({
      ...comment,
       timeLabel: timeFormatter.format(new Date(comment.createdAt)),
    })),
    createdAtLabel: dateTimeFormatter.format(new Date(detail.post.createdAt)),
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
