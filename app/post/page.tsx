import { createCloudinaryImageStorage } from "@/app/infrastructure";
import { PostForm } from "@/app/features/feed";
import type { PostFormInitialValues } from "@/app/features/feed";
import {
  createPostAction,
  getAuthorizedPostTargets,
  getFeedById,
  updatePostAction,
} from "@/app/features/feed/server";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/auth";

function getQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Renders the authorized create or edit post form.
 *
 * @param props - Route search parameters containing an optional post ID.
 * @param props.searchParams - Promise with the `id` query parameter.
 * @returns The post form with only authorized destinations.
 */
export default async function PostPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string | string[] }>;
}) {
  const session = await requireStaffSession();
  const postId = getQueryValue((await searchParams)?.id);
  const [targets, post] = await Promise.all([
    getAuthorizedPostTargets(session.user.personId),
    postId ? getFeedById(postId) : Promise.resolve(null),
  ]);

  if (postId && (!post || post.authorId !== session.user.personId)) {
    redirect("/home");
  }

  const targetKidId = post
    ? post.kidId
    : targets.kids[0]?.id ?? null;
  const targetRoomId = post
    ? post.roomId
    : targetKidId
      ? null
      : targets.rooms[0]?.id ?? null;
  const hasAuthorizedTarget =
    (targetKidId && targets.kids.some((kid) => kid.id === targetKidId)) ||
    (targetRoomId && targets.rooms.some((room) => room.id === targetRoomId));

  if (!hasAuthorizedTarget) {
    redirect("/home");
  }

  const existingMedia = post?.media.length
    ? (() => {
        const imageStorage = createCloudinaryImageStorage();
        return post.media.map((media) => ({
          media,
          url: imageStorage.getUrl(media),
        }));
      })()
    : [];
  const initialValues: PostFormInitialValues = {
    body: post?.body ?? "",
    existingMedia,
    kidId: targetKidId,
    mode: post ? "edit" : "create",
    ...(post ? { postId: post.id } : {}),
    roomId: targetRoomId,
    type: post?.type ?? "activity",
  };

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <PostForm
        action={post ? updatePostAction : createPostAction}
        cancelHref="/home"
        initialValues={initialValues}
        kids={targets.kids}
        rooms={targets.rooms}
      />
    </main>
  );
}
