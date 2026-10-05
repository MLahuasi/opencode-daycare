import { redirect } from "next/navigation";
import { requireStaffSession } from "@/auth";
import { updatePostAction } from "@/app/features/feed/server";
import { getPostTargets } from "@/src/application/post";
import { createPostComposition } from "@/src/composition/post";
import { createPostImageStorage } from "@/src/composition/post";
import {
  PostForm,
  type PostFormInitialValues,
} from "@/src/presentation/post";

/** Dynamic parameters accepted by the staff Post edit route. */
type EditPostPageProps = {
  /** Promise containing the canonical Post identifier. */
  params: Promise<{ postId: string }>;
};

/**
 * Renders the staff form for editing an authored Post.
 *
 * @param props - Dynamic edit route parameters.
 * @param props.params - Promise containing the requested Post identifier.
 * @returns The authorized Post edit form, or a redirect when unavailable.
 */
export default async function EditPostPage({
  params,
}: EditPostPageProps) {
  const session = await requireStaffSession();
  const { postId } = await params;
   const dependencies = createPostComposition();
   const [post, targets] = await Promise.all([
     dependencies.posts.findById(postId),
     getPostTargets(dependencies, {
       personId: session.user.personId,
       role: session.user.role,
     }),
   ]);

  if (!post || post.authorId !== session.user.personId) {
    redirect("/home");
  }

  const targetKid = post.kidId
    ? targets.kids.find((kid) => kid.id === post.kidId)
    : undefined;
  const targetRoom = post.roomId
    ? targets.rooms.find((room) => room.id === post.roomId)
    : undefined;

  if (!targetKid && !targetRoom) {
    redirect("/home");
  }

  const imageStorage = post.media.length
    ? createPostImageStorage()
    : null;
  const existingMedia = imageStorage
    ? post.media.map((media) => ({
        media,
        url: imageStorage.getUrl(media),
      }))
    : [];
  const initialValues: PostFormInitialValues = {
    body: post.body,
    existingMedia,
    kidId: post.kidId,
    mode: "edit",
    postId: post.id,
    roomId: post.roomId,
    type: post.type,
  };

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <PostForm
        action={updatePostAction}
        cancelHref="/home"
        initialValues={initialValues}
        kids={targets.kids}
        rooms={targets.rooms}
      />
    </main>
  );
}
