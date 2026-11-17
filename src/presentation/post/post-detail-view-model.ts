import type { PostDetail } from "@/application/post";
import { createPostDateFormatters } from "@/config";

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

function formatRecipientNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "Varios niños";
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

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
    authorRoleLabel: detail.author.roles.includes("personal") ? "maestra" : "familia",
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
          ? `familia de ${formatRecipientNames(detail.recipient.names)}`
          : `sala ${formatRecipientNames(detail.recipient.names)}`,
    },
  };
}
