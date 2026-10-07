import { derivePostEngagement, type Post } from "@/domain/post";
import type { Kid } from "@/domain/kid";
import type { Room } from "@/domain/room";
import type { PostViewer } from "../ports";
import type {
  CreateCommentInput,
  CreatePostInput,
  PostRecord,
  ToggleReactionResult,
  UpdateCommentInput,
  UpdatePostInput,
} from "../dto";
import {
  createCommentRecord,
  createPostRecord,
  deleteCommentRecord,
  toggleReactionRecord,
  updateCommentRecord,
  updatePostRecord,
} from "../commands";
import type { PostDependencies } from "../post-dependencies";
import { projectPostDetail } from "../queries";
import type { PostDetail } from "../dto";

/** Active Post destinations available to an authenticated staff member. */
export type PostTargets = {
  kids: readonly Kid[];
  rooms: readonly Room[];
};

function getPostSubject(
  post: PostRecord,
  kidsById: ReadonlyMap<string, Kid>,
  roomsById: ReadonlyMap<string, Room>,
): string {
  if (post.kidIds.length > 1) return "Varios niños";
  if (post.kidIds.length === 1) {
    return kidsById.get(post.kidIds[0])?.name ?? "Varios niños";
  }

  return roomsById.get(post.roomId ?? "")?.name ?? "Anuncio general";
}

/**
 * Determines whether all active parents linked to a kid consent to photo sharing.
 *
 * @param dependencies - Persistence capabilities assembled for Post use cases.
 * @param kidId - Stable identifier of the kid receiving media.
 * @returns Whether every linked active parent has given photo-sharing consent.
 */
export async function hasPhotoSharingConsent(
  dependencies: Pick<PostDependencies, "parentKids" | "people">,
  kidId: string,
): Promise<boolean> {
  const [parentKids, people] = await Promise.all([
    dependencies.parentKids.findAll(),
    dependencies.people.findAll(),
  ]);
  const activeParentIds = new Set(
    people
      .filter((person) => person.role === "parent" && person.status === "active")
      .map((person) => person.id),
  );

  return parentKids
    .filter(
      (parentKid) =>
        parentKid.kidId === kidId && activeParentIds.has(parentKid.parentId),
    )
    .every((parentKid) => parentKid.photoSharingConsent);
}

/**
 * Resolves active Post destinations authorized for a staff viewer.
 *
 * @param dependencies - Persistence and authorization ports.
 * @param viewer - Authenticated viewer.
 * @returns Active kids and rooms in assigned staff rooms.
 */
export async function getPostTargets(
  dependencies: PostDependencies,
  viewer: PostViewer,
): Promise<PostTargets> {
  if (viewer.role !== "personal") return { kids: [], rooms: [] };

  const [assignedRoomIds, rooms, kids] = await Promise.all([
    dependencies.authorizationAccess.findStaffRoomIds(viewer.personId),
    dependencies.rooms.findAll(),
    dependencies.kids.findAll(),
  ]);
  const roomIds = new Set(assignedRoomIds);

  return {
    kids: kids.filter((kid) => kid.status === "active" && roomIds.has(kid.roomId)),
    rooms: rooms.filter((room) => roomIds.has(room.id)),
  };
}

/** Reads Posts that are visible to an authenticated viewer. */
export async function getAuthorizedPosts(
  dependencies: PostDependencies,
  viewer: PostViewer,
): Promise<readonly Post[]> {
  const [posts, comments, reactions, kids, rooms] = await Promise.all([
    dependencies.posts.findAll(),
    dependencies.comments.findAll(),
    dependencies.reactions.findAll(),
    dependencies.kids.findAll(),
    dependencies.rooms.findAll(),
  ]);
  const kidsById = new Map(kids.map((kid) => [kid.id, kid]));
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const visibility = await Promise.all(
    posts.map(async (post) => ({
      post,
      visible: await dependencies.authorization.canView(viewer, post),
    })),
  );
  const visiblePosts = visibility
    .filter(({ visible }) => visible)
    .map(({ post }) => post);

  const imageStorage = visiblePosts.some((post) => post.media.length > 0)
    ? dependencies.imageStorage
    : null;

  return visiblePosts.map((post) => ({
    ...post,
    subject: getPostSubject(post, kidsById, roomsById),
    engagement: derivePostEngagement(
      post.id,
      comments,
      reactions,
      viewer.personId,
    ),
    media: imageStorage
      ? post.media.map((media) => ({
          ...media,
          url: imageStorage.getUrl(media),
        }))
      : post.media,
  }));
}

/**
 * Loads and projects one Post detail after evaluating viewer authorization.
 *
 * @param dependencies - Persistence, authorization and provider ports.
 * @param postId - Stable Post identifier.
 * @param viewer - Authenticated viewer.
 * @returns The authorized detail projection, or null when unavailable.
 */
export async function getPostDetail(
  dependencies: PostDependencies,
  postId: string,
  viewer: PostViewer,
): Promise<PostDetail | null> {
  const post = await dependencies.posts.findById(postId);
  if (!post || !(await dependencies.authorization.canView(viewer, post))) {
    return null;
  }

  const [people, comments, reactions, recipientKid, recipientRoom] =
    await Promise.all([
      dependencies.people.findAll(),
      dependencies.comments.findAll(),
      dependencies.reactions.findAll(),
      post.kidIds[0] ? dependencies.kids.findById(post.kidIds[0]) : Promise.resolve(null),
      post.roomId ? dependencies.rooms.findById(post.roomId) : Promise.resolve(null),
    ]);
  const author = people.find((person) => person.id === post.authorId);
  if (!author) return null;

  const engagement = await getPostEngagement(
    dependencies,
    post.id,
    viewer.personId,
  );
  const imageStorage = post.media.length > 0 ? dependencies.imageStorage : null;
  const projectedPost = {
    ...post,
    engagement,
    media: imageStorage
      ? post.media.map((media) => ({
          ...media,
          url: imageStorage.getUrl(media),
        }))
      : post.media,
  };

  return projectPostDetail({
    author,
    comments: comments.filter((comment) => comment.postId === post.id),
    people,
    post: projectedPost,
    reactions: reactions.filter((reaction) => reaction.postId === post.id),
    recipientKid,
    recipientRoom,
    viewerRole: viewer.role,
  });
}

async function getPostEngagement(
  dependencies: PostDependencies,
  postId: string,
  viewerId: string,
) {
  const [comments, reactions] = await Promise.all([
    dependencies.comments.findAll(),
    dependencies.reactions.findAll(),
  ]);
  return derivePostEngagement(postId, comments, reactions, viewerId);
}

/**
 * Authorizes and persists a new Post.
 *
 * @param dependencies - Persistence, authorization and provider ports.
 * @param input - Validated Post values.
 * @param viewer - Authenticated creator.
 * @returns The persisted Post, or null when creation is unauthorized.
 */
export async function createPost(
  dependencies: PostDependencies,
  input: CreatePostInput,
  viewer: PostViewer,
): Promise<PostRecord | null> {
  if (!(await dependencies.authorization.canCreate(viewer, input))) {
    return null;
  }

  const timestamp = dependencies.clock.now().toISOString();
  const post = createPostRecord(
    input,
    dependencies.identifiers.create(),
    timestamp,
  );
  return dependencies.posts.create(post);
}

/**
 * Authorizes and persists an update to an existing Post.
 *
 * @param dependencies - Persistence, authorization and provider ports.
 * @param id - Stable Post identifier.
 * @param input - Validated replacement values.
 * @param viewer - Authenticated editor.
 * @returns The updated Post, or null when unavailable or unauthorized.
 */
export async function updatePost(
  dependencies: PostDependencies,
  id: string,
  input: UpdatePostInput,
  viewer: PostViewer,
): Promise<PostRecord | null> {
  const currentPost = await dependencies.posts.findById(id);
  if (!currentPost || !dependencies.authorization.canEdit(viewer, currentPost)) {
    return null;
  }

  const updatedPost = updatePostRecord(
    currentPost,
    input,
    dependencies.clock.now().toISOString(),
  );
  return updatedPost ? dependencies.posts.update(updatedPost) : null;
}

/**
 * Authorizes and toggles a viewer's love reaction.
 *
 * @param dependencies - Persistence and authorization ports.
 * @param postId - Stable Post identifier.
 * @param viewer - Authenticated person.
 * @returns The resulting state, or null when the Post is unavailable or unauthorized.
 */
export async function toggleReaction(
  dependencies: PostDependencies,
  postId: string,
  viewer: PostViewer,
): Promise<{ active: boolean } | null> {
  const post = await dependencies.posts.findById(postId);
  if (!post || !(await dependencies.authorization.canView(viewer, post))) {
    return null;
  }

  const reactions = await dependencies.reactions.findAll();
  const result: ToggleReactionResult = toggleReactionRecord(
    reactions,
    postId,
    viewer.personId,
    dependencies.identifiers.create(),
    dependencies.clock.now().toISOString(),
  );
  const existing = reactions.find(
    (reaction) =>
      reaction.postId === postId &&
      reaction.personId === viewer.personId &&
      reaction.type === "love",
  );

  if (result.active) {
    const created = result.reactions[result.reactions.length - 1];
    if (created) await dependencies.reactions.create(created);
  } else if (existing) {
    await dependencies.reactions.delete(existing.id);
  }

  return { active: result.active };
}

/**
 * Authorizes and persists a new comment.
 *
 * @param dependencies - Persistence and authorization ports.
 * @param input - Validated comment values.
 * @param viewer - Authenticated author.
 * @returns The persisted comment, or null when the Post is unavailable or unauthorized.
 */
export async function createComment(
  dependencies: PostDependencies,
  input: CreateCommentInput,
  viewer: PostViewer,
) {
  const post = await dependencies.posts.findById(input.postId);
  if (!post || !(await dependencies.authorization.canView(viewer, post))) {
    return null;
  }

  const comment = createCommentRecord(
    input,
    dependencies.identifiers.create(),
    dependencies.clock.now().toISOString(),
  );
  await dependencies.comments.create(comment);
  return comment;
}

/**
 * Authorizes and persists an update to an owned comment.
 *
 * @param dependencies - Persistence and authorization ports.
 * @param input - Validated replacement values.
 * @param viewer - Authenticated author.
 * @returns The updated comment, or null when unavailable or unauthorized.
 */
export async function updateComment(
  dependencies: PostDependencies,
  input: UpdateCommentInput,
  viewer: PostViewer,
) {
  const comment = await dependencies.comments.findById(input.commentId);
  if (!comment || comment.authorId !== viewer.personId) return null;

  const post = await dependencies.posts.findById(comment.postId);
  if (!post || !(await dependencies.authorization.canView(viewer, post))) {
    return null;
  }

  const updatedComment = updateCommentRecord(
    comment,
    input,
    dependencies.clock.now().toISOString(),
  );
  if (!updatedComment) return null;
  await dependencies.comments.update(updatedComment);
  return updatedComment;
}

/**
 * Authorizes and deletes an owned comment.
 *
 * @param dependencies - Persistence and authorization ports.
 * @param commentId - Stable comment identifier.
 * @param viewer - Authenticated author.
 * @returns Whether a comment was deleted.
 */
export async function deleteComment(
  dependencies: PostDependencies,
  commentId: string,
  viewer: PostViewer,
): Promise<boolean> {
  const comment = await dependencies.comments.findById(commentId);
  if (!comment || comment.authorId !== viewer.personId) return false;

  const post = await dependencies.posts.findById(comment.postId);
  if (!post || !(await dependencies.authorization.canView(viewer, post))) {
    return false;
  }

  const comments = await dependencies.comments.findAll();
  const result = deleteCommentRecord(comments, commentId, viewer.personId);
  if (!result.deleted) return false;
  return dependencies.comments.delete(commentId);
}
