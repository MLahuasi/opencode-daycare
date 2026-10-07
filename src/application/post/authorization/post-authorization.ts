import type { PersistedPost } from "@/domain/post";
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
      if (post.roomId !== null) return roomIds.has(post.roomId);

      const targetKids = await Promise.all(
        post.kidIds.map((kidId) => this.access.findKidById(kidId)),
      );
      return targetKids.every(
        (kid) => kid !== null && roomIds.has(kid.roomId),
      );
    }

    const parentKidIds = await this.access.findParentKidIds(viewer.personId);
    const activeKids = await this.access.findActiveKidsByIds(parentKidIds);
    const activeKidIds = new Set(activeKids.map((kid) => kid.id));
    const activeRoomIds = new Set(activeKids.map((kid) => kid.roomId));

    return post.kidIds.length > 0
      ? post.kidIds.some((kidId) => activeKidIds.has(kidId))
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
    post: Pick<PersistedPost, "kidIds" | "roomId">,
  ): Promise<boolean> {
    if (viewer.role !== "personal") return false;

    const roomIds = new Set(
      await this.access.findStaffRoomIds(viewer.personId),
    );
    if (post.roomId !== null) return roomIds.has(post.roomId);

    const targetKids = await Promise.all(
      post.kidIds.map((kidId) => this.access.findKidById(kidId)),
    );
    return targetKids.length > 0 && targetKids.every(
      (kid) => kid !== null && roomIds.has(kid.roomId),
    );
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
