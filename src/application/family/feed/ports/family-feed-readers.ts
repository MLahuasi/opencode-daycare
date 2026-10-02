import type { ParentKid } from "@/src/domain/family";
import type { Kid } from "@/src/domain/kid";
import type { Person } from "@/src/domain/person";
import type { Post } from "@/src/domain/post";
import type { Room } from "@/src/domain/room";

/** Reads the person required to build an authorized family context. */
export interface FamilyFeedPersonReader {
  /**
   * Finds a person by stable identifier.
   *
   * @param id - Person identifier.
   * @returns The person or null when it does not exist.
   */
  findById(id: string): Promise<Person | null>;
}

/** Reads parent-child relationships for Family Feed authorization. */
export interface FamilyFeedParentKidReader {
  /**
   * Lists relationships belonging to a parent.
   *
   * @param parentId - Parent person identifier.
   * @returns Relationships owned by the parent.
   */
  findByParentId(parentId: string): Promise<readonly ParentKid[]>;
}

/** Reads the daycare records used by Family Feed visibility rules. */
export interface FamilyFeedDirectoryReader {
  /** @returns All persisted children. */
  findKids(): Promise<readonly Kid[]>;
  /** @returns All persisted rooms. */
  findRooms(): Promise<readonly Room[]>;
}

/** Reads Posts available for a viewer before family visibility filtering. */
export interface FamilyFeedPostReader {
  /**
   * Lists Posts with engagement derived for a viewer.
   *
   * @param viewerId - Current person's identifier.
   * @returns Posts available to the viewer.
   */
  findForViewer(viewerId: string): Promise<readonly Post[]>;
}

/** Resolves media URLs without changing the Post contract. */
export interface FamilyFeedMediaResolver {
  /**
   * Resolves media URLs for a Post projection.
   *
   * @param posts - Posts whose media should be resolved.
   * @returns Posts with resolved media URLs.
   */
  resolve(posts: readonly Post[]): Promise<readonly Post[]>;
}

/** Ports required by Family Feed application queries. */
export type FamilyFeedQueryDependencies = {
  directory: FamilyFeedDirectoryReader;
  media: FamilyFeedMediaResolver;
  parentKids: FamilyFeedParentKidReader;
  people: FamilyFeedPersonReader;
  posts: FamilyFeedPostReader;
};
