import { redirect } from "next/navigation";
import { requireStaffSession } from "@/auth";
import { createPostAction } from "@/app/_actions/posts";
import { getPostTargets } from "@/src/application/post";
import { createPostComposition } from "@/src/composition/post";
import {
  PostForm,
  type PostFormInitialValues,
} from "@/src/presentation/post";

/**
 * Renders the staff form for creating a new Post.
 *
 * @returns The authorized empty Post form, or a redirect when no destination exists.
 */
export default async function NewPostPage() {
  const session = await requireStaffSession();
   const targets = await getPostTargets(
     createPostComposition(),
     { personId: session.user.personId, role: session.user.role },
   );
  const kidId = targets.kids[0]?.id ?? null;
  const roomId = kidId ? null : targets.rooms[0]?.id ?? null;

  if (!kidId && !roomId) {
    redirect("/home");
  }

  const initialValues: PostFormInitialValues = {
    body: "",
    existingMedia: [],
    kidId,
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
        rooms={targets.rooms}
      />
    </main>
  );
}
