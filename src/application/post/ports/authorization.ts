import type { PersonRole } from "@/src/domain/person";
import type { PersistedPost } from "@/src/domain/post";
import type { Kid } from "@/src/domain/kid";

/** Authenticated identity used by Post authorization. */
export type PostViewer = {
  personId: string;
  role: PersonRole;
};

/** Persistence capabilities required to evaluate Post access. */
export interface PostAccessRepository {
  /**
   * Lists rooms assigned to a staff member.
   *
   * @param personId - Stable identifier of the staff member.
   * @returns Assigned room identifiers.
   */
  findStaffRoomIds(personId: string): Promise<readonly string[]>;
  /**
   * Lists kids related to a parent.
   *
   * @param personId - Stable identifier of the parent.
   * @returns Linked kid identifiers.
   */
  findParentKidIds(personId: string): Promise<readonly string[]>;
  /**
   * Finds a kid by stable identifier.
   *
   * @param id - Stable identifier of the kid.
   * @returns The matching kid, or null when it does not exist.
   */
  findKidById(id: string): Promise<Kid | null>;
  /**
   * Lists active kids from a set of identifiers.
   *
   * @param ids - Kid identifiers to inspect.
   * @returns Active kids matching the identifiers.
   */
  findActiveKidsByIds(ids: readonly string[]): Promise<readonly Kid[]>;
}

/** Authorization capabilities required by Post use cases. */
export interface PostAuthorization {
  /**
   * Checks whether a viewer can read or engage with a Post.
   *
   * @param viewer - Authenticated identity requesting access.
   * @param post - Post whose visibility is being evaluated.
   * @returns Whether the viewer can access the Post.
   */
  canView(viewer: PostViewer, post: PersistedPost): Promise<boolean>;
  /**
   * Checks whether a staff viewer can create a Post for a destination.
   *
   * @param viewer - Authenticated identity creating the Post.
   * @param post - Post destination being evaluated.
   * @returns Whether the viewer can create the Post.
   */
  canCreate(viewer: PostViewer, post: Pick<PersistedPost, "kidId" | "roomId">): Promise<boolean>;
  /**
   * Checks whether a viewer can edit a Post.
   *
   * @param viewer - Authenticated identity requesting the edit.
   * @param post - Post whose ownership is being evaluated.
   * @returns Whether the viewer can edit the Post.
   */
  canEdit(viewer: PostViewer, post: PersistedPost): boolean;
}
