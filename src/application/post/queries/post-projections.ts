import type { PostComment, PostReaction } from "@/src/domain/post";
import type { Person } from "@/src/domain/person";
import type {
  PostDetail,
  PostDetailComment,
  PostDetailProjectionInput,
  PostDetailReaction,
} from "../dto";

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

function getPersonRoleLabel(role: Person["role"]): string {
  return role === "personal" ? "maestra" : "familia";
}

function projectComments(
  comments: readonly PostComment[],
  people: ReadonlyMap<string, Person>,
): readonly PostDetailComment[] {
  return [...comments]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    )
    .flatMap((comment) => {
      const author = people.get(comment.authorId);
      return author
        ? [
            {
              ...comment,
              author,
              timeLabel: guayaquilTime.format(new Date(comment.createdAt)),
            },
          ]
        : [];
    });
}

function projectReactions(
  reactions: readonly PostReaction[],
  people: ReadonlyMap<string, Person>,
): readonly PostDetailReaction[] {
  return reactions.flatMap((reaction) => {
    const person = people.get(reaction.personId);
    return person ? [{ ...reaction, person }] : [];
  });
}

/**
 * Projects an authorized Post and its related records for detail rendering.
 *
 * @param input - Authorized Post data and related records.
 * @returns The Post detail projection, or null without a valid recipient.
 */
export function projectPostDetail(
  input: PostDetailProjectionInput,
): PostDetail | null {
  const recipient = input.recipientKid
    ? {
        id: input.recipientKid.id,
        kind: "kid" as const,
        label: `familia de ${input.recipientKid.name}`,
      }
    : input.recipientRoom
      ? {
          id: input.recipientRoom.id,
          kind: "room" as const,
          label: `sala ${input.recipientRoom.name}`,
        }
      : null;

  if (!recipient) {
    return null;
  }

  const people = new Map(input.people.map((person) => [person.id, person]));

  return {
    author: input.author,
    authorRoleLabel: getPersonRoleLabel(input.author.role),
    comments: projectComments(input.comments, people),
    createdAtLabel: guayaquilDateTime.format(new Date(input.post.createdAt)),
    post: input.post,
    reactions: projectReactions(input.reactions, people),
    recipient,
    viewerRole: input.viewerRole,
  };
}
