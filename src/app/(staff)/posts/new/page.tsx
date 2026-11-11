import { redirect } from "next/navigation";
import { getHttpSecurityEnvironment } from "@/config/server";
import { requireStaffSession } from "@/composition/auth";
import { createPostAction } from "@/app/_actions/posts";
import { getPostTargets } from "@/application/post";
import { createPostComposition, getPostViewer } from "@/composition/post";
import {
  PostForm,
  type PostFormInitialValues,
} from "@/presentation/post";

/**
 * Renders the staff form for creating a new Post.
 *
 * @returns The authorized empty Post form, or a redirect when no destination exists.
 */
export default async function NewPostPage() {
  const session = await requireStaffSession();
   const targets = await getPostTargets(
     createPostComposition(session.user.daycareId),
       await getPostViewer(session.user.daycareId, session.user.personId),
   );
  const roomId = null;

  if (targets.kids.length === 0 && targets.rooms.length === 0) {
    redirect("/home");
  }

  const initialValues: PostFormInitialValues = {
    body: "",
    existingMedia: [],
    kidIds: [],
    mode: "create",
    roomId,
    type: "activity",
  };

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <PostForm
        action={createPostAction}
        cancelHref="/home"
        initialValues={initialValues}
        kids={targets.kids}
        limits={getHttpSecurityEnvironment()}
        rooms={targets.rooms}
      />
    </main>
  );
}
