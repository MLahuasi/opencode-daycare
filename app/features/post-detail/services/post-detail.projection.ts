import "server-only";

import { resolveFeedMediaUrls } from "@/app/features/feed/server";
import type { Person } from "@/app/features/people";
import { readCollection } from "@/app/infrastructure/persistence";
import type {
  PostDetail,
  PostDetailComment,
  PostDetailReaction,
} from "../types";
import { getAuthorizedPostData } from "./post-detail.service";

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

/**
 * Projects an authorized post and its relations for the read-only detail UI.
 *
 * @param id - Stable identifier of the requested post.
 * @returns The authorized detail projection, or null when it is unavailable.
 */
export async function getPostDetail(id: string): Promise<PostDetail | null> {
  const data = await getAuthorizedPostData(id);

  if (!data) {
    return null;
  }

  const people = await readCollection<Person>("people.json");
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const projectedPost = resolveFeedMediaUrls([data.post])[0];
  const recipient = data.recipientKid
    ? {
        id: data.recipientKid.id,
        kind: "kid" as const,
        label: `familia de ${data.recipientKid.name}`,
      }
    : data.recipientRoom
      ? {
          id: data.recipientRoom.id,
          kind: "room" as const,
          label: `sala ${data.recipientRoom.name}`,
        }
      : null;

  if (!projectedPost || !recipient) {
    return null;
  }

  const comments = data.comments.flatMap<PostDetailComment>((comment) => {
    const author = peopleById.get(comment.authorId);
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
  const reactions = data.reactions.flatMap<PostDetailReaction>((reaction) => {
    const person = peopleById.get(reaction.personId);
    return person ? [{ ...reaction, person }] : [];
  });

  return {
    author: data.author,
    authorRoleLabel: getPersonRoleLabel(data.author.role),
    comments,
    createdAtLabel: guayaquilDateTime.format(new Date(data.post.createdAt)),
    post: projectedPost,
    reactions,
    recipient,
    viewerRole: data.viewerRole,
  };
}
