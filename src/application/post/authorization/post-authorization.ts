import type { PersistedPost } from "@/src/domain/post";
import type {
  PostAccessRepository,
  PostAuthorization,
  PostViewer,
} from "../ports";

/** Application authorization policy for Post operations. */
export class PostAuthorizationPolicy implements PostAuthorization {
  /**
   * Creates an authorization policy backed by access data ports.
   *
   * @param access - Port used to resolve staff assignments and family links.
   */
  public constructor(private readonly access: PostAccessRepository) {}

  /**
   * Checks whether a viewer can read or engage with a Post.
   *
   * @param viewer - Authenticated identity requesting access.
   * @param post - Post whose visibility is being evaluated.
   * @returns Whether the viewer can access the Post.
   */
  public async canView(
    viewer: PostViewer,
    post: PersistedPost,
  ): Promise<boolean> {
    if (viewer.role === "personal") {
      const roomIds = new Set(
        await this.access.findStaffRoomIds(viewer.personId),
      );
      const postRoomId = post.roomId ??
        (post.kidId
          ? (await this.access.findKidById(post.kidId))?.roomId
          : undefined);
      return postRoomId !== undefined && roomIds.has(postRoomId);
    }

    const parentKidIds = await this.access.findParentKidIds(viewer.personId);
    const activeKids = await this.access.findActiveKidsByIds(parentKidIds);
    const activeKidIds = new Set(activeKids.map((kid) => kid.id));
    const activeRoomIds = new Set(activeKids.map((kid) => kid.roomId));

    return post.kidId
      ? activeKidIds.has(post.kidId)
      : post.roomId !== null && activeRoomIds.has(post.roomId);
  }

  /**
   * Checks whether a staff viewer can create a Post for a destination.
   *
   * @param viewer - Authenticated identity creating the Post.
   * @param post - Post destination being evaluated.
   * @returns Whether the viewer can create the Post for that destination.
   */
  public async canCreate(
    viewer: PostViewer,
    post: Pick<PersistedPost, "kidId" | "roomId">,
  ): Promise<boolean> {
    if (viewer.role !== "personal") return false;

    const roomIds = new Set(
      await this.access.findStaffRoomIds(viewer.personId),
    );
    const postRoomId = post.roomId ??
      (post.kidId
        ? (await this.access.findKidById(post.kidId))?.roomId
        : undefined);
    return postRoomId !== undefined && roomIds.has(postRoomId);
  }

  /**
   * Checks whether a viewer can edit a Post.
   *
   * @param viewer - Authenticated identity requesting the edit.
   * @param post - Post whose ownership is being evaluated.
   * @returns Whether the viewer can edit the Post.
   */
  public canEdit(viewer: PostViewer, post: PersistedPost): boolean {
    return viewer.role === "personal" && post.authorId === viewer.personId;
  }
}
