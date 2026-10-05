import type { PostComment, PostReaction } from "@/domain/post";
import type { Person } from "@/domain/person";
import type {
  PostDetail,
  PostDetailComment,
  PostDetailProjectionInput,
  PostDetailReaction,
} from "../dto";

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
    ? { id: input.recipientKid.id, kind: "kid" as const, name: input.recipientKid.name }
    : input.recipientRoom
      ? { id: input.recipientRoom.id, kind: "room" as const, name: input.recipientRoom.name }
      : null;

  if (!recipient) {
    return null;
  }

  const people = new Map(input.people.map((person) => [person.id, person]));

  return {
    author: input.author,
    comments: projectComments(input.comments, people),
    post: input.post,
    reactions: projectReactions(input.reactions, people),
    recipient,
    viewerRole: input.viewerRole,
  };
}
